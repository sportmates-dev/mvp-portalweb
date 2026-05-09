-- ============================================================================
-- SportMates MVP — Initial Database Schema
-- 5 tables: profiles, matches, applications, attendances, ratings
-- Trigger: auto-create profile on signup
-- RLS: 11 policies + storage bucket
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extension needed for UUID generation
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — one row per authenticated user, linked to auth.users via FK
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  photo_url  TEXT,
  position   TEXT CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  role       TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'organizer', 'both')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'User profiles linked 1:1 to Supabase Auth users';
COMMENT ON COLUMN public.profiles.position IS 'Football position: goalkeeper|defender|midfielder|forward (Spanish: arquero|defensa|mediocampista|delantero)';
COMMENT ON COLUMN public.profiles.role IS 'App role: player|organizer|both';

-- ----------------------------------------------------------------------------
-- matches — football matches created by organizers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organizer_id  UUID NOT NULL REFERENCES public.profiles(id),
  date          DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  location      TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  slots         INTEGER NOT NULL CHECK (slots > 0),
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'full', 'closed', 'cancelled')),
  whatsapp_link TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.matches IS 'Football matches created by organizers';
COMMENT ON COLUMN public.matches.slots IS 'Total number of player slots';
COMMENT ON COLUMN public.matches.status IS 'Lifecycle: open → full → closed | cancelled (manual)';
COMMENT ON COLUMN public.matches.whatsapp_link IS 'Visible only to organizer and accepted players (RLS column-level)';

-- ----------------------------------------------------------------------------
-- applications — player join requests for a match
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.applications (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id   BIGINT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'kicked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

COMMENT ON TABLE public.applications IS 'Player applications to join matches';
COMMENT ON COLUMN public.applications.status IS 'Application lifecycle: pending → accepted|rejected|kicked';

-- ----------------------------------------------------------------------------
-- attendances — post-match attendance tracking by organizer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendances (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id  BIGINT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attended  BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(match_id, player_id)
);

COMMENT ON TABLE public.attendances IS 'Post-match attendance records (binary: attended or not)';

-- ----------------------------------------------------------------------------
-- ratings — post-match confidence ratings (1-5) by organizer
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id         BIGINT NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 1 AND 5),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

COMMENT ON TABLE public.ratings IS 'Organizer-given confidence ratings (1-5) for players post-match';
COMMENT ON COLUMN public.ratings.confidence_score IS '1 = low confidence, 5 = high confidence';

-- ============================================================================
-- TRIGGER: Auto-create profile on auth.users INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'No Name')
  );
  RETURN NEW;
END;
$$;

-- Wire trigger to auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- ENABLE RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- profiles policies
-- ----------------------------------------------------------------------------

-- Policy 1: Users can read any profile (needed for avatars, names in lists)
CREATE POLICY "Profiles are publicly readable"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Policy 2: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- matches policies
-- ----------------------------------------------------------------------------

-- Policy 3: Public read for open and full matches (visible on landing page)
CREATE POLICY "Public read for open/full matches"
  ON public.matches
  FOR SELECT
  USING (status IN ('open', 'full'));

-- Policy 4: Organizer can read and write their own matches
CREATE POLICY "Organizer full access to own matches"
  ON public.matches
  FOR ALL
  USING (auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = organizer_id);

-- Policy 5: Accepted players can read match details (for MatchDetail page)
CREATE POLICY "Accepted players can read match details"
  ON public.matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      WHERE a.match_id = id
        AND a.player_id = auth.uid()
        AND a.status = 'accepted'
    )
  );

-- Policy 6: Authenticated users can insert (create) matches
-- RLS check: the organizer_id must be the authenticated user
CREATE POLICY "Authenticated users can create matches"
  ON public.matches
  FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

-- ----------------------------------------------------------------------------
-- applications policies
-- ----------------------------------------------------------------------------

-- Policy 7: Players can read their own applications
CREATE POLICY "Players read own applications"
  ON public.applications
  FOR SELECT
  USING (auth.uid() = player_id);

-- Policy 8: Organizers can read applications for their matches
CREATE POLICY "Organizers read applications for own matches"
  ON public.applications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

-- Policy 9: Players can insert their own applications
CREATE POLICY "Players can apply to matches"
  ON public.applications
  FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- Policy 10: Organizers can update applications for their matches (accept/reject/kick)
CREATE POLICY "Organizers can update applications for own matches"
  ON public.applications
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- attendances policies
-- ----------------------------------------------------------------------------

-- Policy 11: Organizers full access to attendances for their matches
CREATE POLICY "Organizers full access to attendances for own matches"
  ON public.attendances
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

-- Policy 12: Players can read their own attendance records
CREATE POLICY "Players read own attendance"
  ON public.attendances
  FOR SELECT
  USING (auth.uid() = player_id);

-- ----------------------------------------------------------------------------
-- ratings policies
-- ----------------------------------------------------------------------------

-- Policy 13: Organizers full access to ratings for their matches
CREATE POLICY "Organizers full access to ratings for own matches"
  ON public.ratings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.matches m
      WHERE m.id = match_id
        AND m.organizer_id = auth.uid()
    )
  );

-- Policy 14: Players can read their own ratings
CREATE POLICY "Players read own ratings"
  ON public.ratings
  FOR SELECT
  USING (auth.uid() = player_id);

-- ============================================================================
-- STORAGE: Avatars bucket + RLS
-- ============================================================================

-- Create the avatars bucket (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS on storage.objects — users can only write to their own folder
-- Path convention: {user_id}/photo.jpg
CREATE POLICY "Users can upload own avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- ============================================================================
-- GRANTS: Base table privileges required for RLS policies to work
-- ============================================================================

-- Schema usage (required for both roles to access any table in public)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- anon: unauthenticated visitors (landing page only)
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.matches TO anon;
GRANT SELECT ON public.applications TO anon;

-- authenticated: logged-in users
-- profiles: read all, update own
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- matches: read public + own + accepted, create/update/delete own
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;

-- applications: read own + for own matches, apply, update by organizer
GRANT SELECT, INSERT, UPDATE ON public.applications TO authenticated;

-- attendances: read own + for own matches, manage by organizer
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendances TO authenticated;

-- ratings: read own + for own matches, manage by organizer
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;

-- ============================================================================
-- INDEXES for common query patterns
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_matches_date
  ON public.matches(date ASC)
  WHERE status IN ('open', 'full');

CREATE INDEX IF NOT EXISTS idx_matches_organizer
  ON public.matches(organizer_id);

CREATE INDEX IF NOT EXISTS idx_applications_match
  ON public.applications(match_id);

CREATE INDEX IF NOT EXISTS idx_applications_player
  ON public.applications(player_id);

CREATE INDEX IF NOT EXISTS idx_attendances_match
  ON public.attendances(match_id);

CREATE INDEX IF NOT EXISTS idx_ratings_match
  ON public.ratings(match_id);

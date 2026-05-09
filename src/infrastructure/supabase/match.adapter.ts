import { supabase } from './client'
import type { IMatchPort, CreateMatchInput, MatchFilters } from '@application/ports/match.port'
import type { Match, MatchStatus } from '@domain/match'
import type { Application } from '@domain/application'
import type { Profile } from '@domain/profile'

// No generated Supabase types yet — cast to any for MVP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string): any => supabase.from(table)

function isSchemaError(error: { message?: string }): boolean {
  const msg = error.message ?? ''
  return msg.includes('does not exist') || msg.includes('Could not find')
}

/**
 * Player data joined from profiles table when querying applications.
 */
export interface ApplicationWithProfile {
  id: number
  match_id: number
  player_id: string
  status: string
  created_at: string
  profiles: Pick<Profile, 'id' | 'name' | 'photo_url' | 'position' | 'role'> | null
}

/**
 * Application row joined with match data — used for "My Matches" listing.
 */
export interface ApplicationWithMatch {
  id: number
  match_id: number
  player_id: string
  status: string
  created_at: string
  matches: Pick<Match, 'id' | 'date' | 'start_time' | 'end_time' | 'location' | 'status' | 'slots'> | null
}

/**
 * Match adapter — implements IMatchPort and provides application-related
 * query methods needed by MatchDetail and other pages.
 */
export const matchAdapter: IMatchPort & {
  getApplications(matchId: number): Promise<Application[]>
  getUserApplication(matchId: number, playerId: string): Promise<Application | null>
  applyToMatch(matchId: number, playerId: string): Promise<void>
  getAcceptedPlayers(matchId: number): Promise<ApplicationWithProfile[]>
  getPlayerApplications(playerId: string): Promise<ApplicationWithMatch[]>
  autoCloseExpired(now: Date): Promise<number>
} = {
  async create(data: CreateMatchInput): Promise<Match> {
    const { data: match, error } = await from('matches')
      .insert({
        organizer_id: data.organizer_id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
        location: data.location,
        description: data.description ?? '',
        slots: data.slots,
        whatsapp_link: data.whatsapp_link ?? null,
      })
      .select('*')
      .single()

    if (error) throw error
    return match as unknown as Match
  },

  async getById(id: number): Promise<Match | null> {
    const { data, error } = await from('matches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      if (isSchemaError(error)) return null
      throw error
    }
    return data as unknown as Match
  },

  async list(filters?: MatchFilters): Promise<Match[]> {
    let query = from('matches')
      .select('*')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (filters?.date) {
      query = query.eq('date', filters.date)
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses)
    }

    const { data, error } = await query

    if (error) {
      if (isSchemaError(error)) return []
      throw error
    }
    return (data as unknown as Match[]) ?? []
  },

  async updateStatus(id: number, status: MatchStatus): Promise<void> {
    const { error } = await from('matches')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  },

  async getByOrganizer(organizerId: string): Promise<Match[]> {
    const { data, error } = await from('matches')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('date', { ascending: true })

    if (error) {
      if (isSchemaError(error)) return []
      throw error
    }
    return (data as unknown as Match[]) ?? []
  },

  // ── Application-related queries (needed for MatchDetail) ────────────────

  async getApplications(matchId: number): Promise<Application[]> {
    const { data, error } = await from('applications')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) {
      if (isSchemaError(error)) return []
      throw error
    }
    return (data as unknown as Application[]) ?? []
  },

  async getUserApplication(matchId: number, playerId: string): Promise<Application | null> {
    const { data, error } = await from('applications')
      .select('*')
      .eq('match_id', matchId)
      .eq('player_id', playerId)
      .maybeSingle()

    if (error) {
      if (isSchemaError(error)) return null
      throw error
    }
    return data as unknown as Application | null
  },

  async applyToMatch(matchId: number, playerId: string): Promise<void> {
    // UPSERT: overwrite rejected/kicked status with a new pending application
    const { error } = await from('applications')
      .upsert(
        {
          match_id: matchId,
          player_id: playerId,
          status: 'pending',
        },
        { onConflict: 'match_id,player_id' },
      )

    if (error) throw error
  },

  async getAcceptedPlayers(matchId: number): Promise<ApplicationWithProfile[]> {
    const { data, error } = await from('applications')
      .select(`
        id, match_id, player_id, status, created_at,
        profiles:player_id (id, name, photo_url, position, role)
      `)
      .eq('match_id', matchId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: true })

    if (error) {
      if (isSchemaError(error)) return []
      throw error
    }
    return (data as unknown as ApplicationWithProfile[]) ?? []
  },

  async getPlayerApplications(playerId: string): Promise<ApplicationWithMatch[]> {
    const { data, error } = await from('applications')
      .select(`
        id, match_id, player_id, status, created_at,
        matches:match_id (id, date, start_time, end_time, location, status, slots)
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isSchemaError(error)) return []
      throw error
    }
    return (data as unknown as ApplicationWithMatch[]) ?? []
  },

  /**
   * Close all open/full matches whose end_time has passed.
   * Runs at page-load on Landing and MatchDetail.
   * Returns number of matches closed.
   *
   * NOTE: Silently returns 0 on permission/RLS errors because users can only
   * update matches they own. Auto-close is best-effort; a Supabase cron or
   * Edge Function is the robust long-term solution.
   */
  async autoCloseExpired(now: Date): Promise<number> {
    const nowTime = now.toTimeString().slice(0, 8) // HH:MM:SS
    const nowDate = now.toISOString().slice(0, 10) // YYYY-MM-DD

    try {
      // Fetch all open/full matches — avoid complex nested or/and filters
      // that PostgREST does not support well in URL query parameters.
      const { data: matches, error: fetchError } = await from('matches')
        .select('id, date, end_time')
        .in('status', ['open', 'full'])

      if (fetchError || !matches || matches.length === 0) return 0

      // Filter expired matches client-side
      const expired = (matches as Array<{ id: number; date: string; end_time: string }>).filter((m) => {
        if (m.date < nowDate) return true
        if (m.date === nowDate && m.end_time < nowTime) return true
        return false
      })

      if (expired.length === 0) return 0

      // Update each expired match individually.
      // Best-effort: some updates may fail due to RLS when the user does not
      // own the match (e.g. anonymous landing page). We count only successes.
      let closedCount = 0
      for (const m of expired) {
        const { error } = await from('matches')
          .update({ status: 'closed' })
          .eq('id', m.id)

        if (!error) closedCount++
      }

      return closedCount
    } catch {
      return 0
    }
  },
}

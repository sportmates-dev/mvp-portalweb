import type { Match, MatchStatus } from '../../domain/match'
import type { ApplicationStatus } from '../../domain/application'

export interface IMatchPort {
  create(data: CreateMatchInput): Promise<Match>
  getById(id: number): Promise<Match | null>
  list(filters?: MatchFilters): Promise<Match[]>
  updateStatus(id: number, status: MatchStatus): Promise<void>
  getByOrganizer(organizerId: string): Promise<Match[]>
}

export interface CreateMatchInput {
  organizer_id: string
  date: string
  start_time: string
  end_time: string
  location: string
  description?: string
  slots: number
  whatsapp_link?: string
}

export interface MatchFilters {
  date?: string
  location?: string
  statuses?: MatchStatus[]
}

// ── Application port (organizer dashboard) ──────────────────────────────

/**
 * Application row joined with its player's profile data.
 * Returned by getApplicationsForMatch for the organizer dashboard.
 */
export interface ApplicationWithPlayer {
  id: number
  match_id: number
  player_id: string
  status: string
  created_at: string
  profiles: {
    id: string
    name: string
    photo_url: string | null
    position: string | null
    role: string
  } | null
}

export interface IApplicationPort {
  /** UPSERT — rejected/kicked players can re-apply. Overwrites previous status. */
  applyToMatch(matchId: number, playerId: string): Promise<void>

  /** Fetch all applications for a match with joined player profile data. */
  getApplicationsForMatch(matchId: number): Promise<ApplicationWithPlayer[]>

  /** Update application status (accept / reject / kick). */
  updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<void>
}

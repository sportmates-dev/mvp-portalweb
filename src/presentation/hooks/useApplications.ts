import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useAuth } from './useAuth'
import { applicationAdapter } from '@infrastructure/supabase/application.adapter'
import { attendanceAdapter } from '@infrastructure/supabase/attendance.adapter'
import { ratingAdapter } from '@infrastructure/supabase/rating.adapter'
import { matchAdapter } from '@infrastructure/supabase/match.adapter'
import {
  canAccept,
  statusAfterAccept,
  statusAfterKick,
} from '@application/services/application.service'
import {
  canPerformPostMatchActions,
  allAttendanceMarked,
} from '@application/services/post-match.service'
import type { Match } from '@domain/match'
import type { ApplicationWithPlayer } from '@application/ports/match.port'
import type { Attendance } from '@domain/attendance'
import type { Rating } from '@domain/rating'

export interface ManageMatchState {
  match: Match | null
  applications: ApplicationWithPlayer[]
  attendances: Attendance[]
  ratings: Rating[]
  loading: boolean
  error: Error | null
  refresh: () => Promise<void>

  /** Accept an application (organizer). Updates slot tracking. */
  acceptApplication: (app: ApplicationWithPlayer) => Promise<boolean>
  /** Reject an application (organizer). */
  rejectApplication: (app: ApplicationWithPlayer) => Promise<boolean>
  /** Kick an accepted player (organizer). May reopen match if slots open up. */
  kickApplication: (app: ApplicationWithPlayer) => Promise<boolean>

  /** Toggle attendance checkbox for a player. */
  toggleAttendance: (playerId: string, attended: boolean) => Promise<void>
  /** Save a confidence rating (1-5) for a player. */
  saveRating: (playerId: string, score: number) => Promise<void>

  /** Cancel the match (sets status to 'cancelled'). */
  cancelMatch: () => Promise<boolean>

  /** Whether the match has ended (post-match actions available). */
  isMatchEnded: boolean
  /** Whether all accepted players have attendance marked (ratings unlocked). */
  isAttendanceCompleted: boolean
}

/**
 * Organizer dashboard hook for managing a match: applications, attendance, ratings.
 *
 * Uses separate adapters per domain concern:
 * - applicationAdapter for postulation CRUD
 * - attendanceAdapter for attendance marking
 * - ratingAdapter for confidence scores
 *
 * Business rules enforced via post-match.service.ts:
 * - Attendance & ratings only available after match end_time
 * - Ratings only available after all accepted players have attendance marked
 * - Only accepted players can be rated
 */
export function useManageMatch(matchId: number): ManageMatchState {
  const { profile } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [applications, setApplications] = useState<ApplicationWithPlayer[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const isOrganizer = profile?.id === match?.organizer_id

  /** Whether the match end_time has passed. */
  const isMatchEnded = match ? canPerformPostMatchActions(match) : false

  /** Whether all accepted players have attendance records (unlocks ratings). */
  const isAttendanceCompleted = allAttendanceMarked(
    applications.filter((a) => a.status === 'accepted').map((a) => a.player_id),
    attendances,
  )

  /** Stable helper: count accepted applications from current state. */
  const getAcceptedCount = useCallback(
    () => applications.filter((a) => a.status === 'accepted').length,
    [applications],
  )

  // ── Data fetching with ref + setTimeout to avoid synchronous setState in effect ─

  const fetchRef = useRef<() => Promise<void>>(async () => {})

  const doFetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Auto-close expired matches on page load
      await matchAdapter.autoCloseExpired(new Date())

      const m = await matchAdapter.getById(matchId)
      setMatch(m)

      if (m && isOrganizer) {
        const [apps, atts, rats] = await Promise.all([
          applicationAdapter.getApplicationsForMatch(matchId),
          attendanceAdapter.getAttendanceForMatch(matchId),
          ratingAdapter.getRatingsForMatch(matchId),
        ])
        setApplications(apps)
        setAttendances(atts)
        setRatings(rats)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load match data'))
    } finally {
      setLoading(false)
    }
  }, [matchId, isOrganizer])

  // Sync ref outside render — avoids the "refs during render" rule
  useLayoutEffect(() => {
    fetchRef.current = doFetch
  })

  // Effect defers the initial fetch via setTimeout to avoid synchronous setState
  useEffect(() => {
    const id = setTimeout(() => {
      fetchRef.current()
    }, 0)
    return () => clearTimeout(id)
  }, [matchId, isOrganizer])

  /** Public refresh — returns a promise so callers can await completion. */
  const refresh = useCallback(() => fetchRef.current(), [])

  // ── Application actions ─────────────────────────────────────────────

  const acceptApplication = useCallback(
    async (app: ApplicationWithPlayer): Promise<boolean> => {
      if (!match) return false
      const acceptedCount = getAcceptedCount()

      if (!canAccept(match.slots, acceptedCount, match.status)) {
        setError(new Error('No hay cupos disponibles para aceptar este jugador.'))
        return false
      }

      try {
        await applicationAdapter.updateApplicationStatus(app.id, 'accepted')

        // Sync match status if now full
        const newStatus = statusAfterAccept(match.status, match.slots, acceptedCount)
        if (newStatus !== match.status) {
          await matchAdapter.updateStatus(match.id, newStatus)
        }

        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al aceptar la postulación'))
        return false
      }
    },
    [match, getAcceptedCount, refresh],
  )

  const rejectApplication = useCallback(
    async (app: ApplicationWithPlayer): Promise<boolean> => {
      // If the player was accepted, we must also handle slot re-opening
      const wasAccepted = app.status === 'accepted'

      try {
        await applicationAdapter.updateApplicationStatus(app.id, 'rejected')

        if (wasAccepted && match) {
          // Remove this one from the accepted count
          const acceptedAfter = getAcceptedCount() - 1
          const newStatus = statusAfterKick(match.status, match.slots, acceptedAfter)
          if (newStatus !== match.status) {
            await matchAdapter.updateStatus(match.id, newStatus)
          }
        }

        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al rechazar la postulación'))
        return false
      }
    },
    [match, getAcceptedCount, refresh],
  )

  const kickApplication = useCallback(
    async (app: ApplicationWithPlayer): Promise<boolean> => {
      try {
        await applicationAdapter.updateApplicationStatus(app.id, 'kicked')

        if (match) {
          // Kicking always removes from accepted count (they were accepted)
          const acceptedAfter = getAcceptedCount() - 1
          const newStatus = statusAfterKick(match.status, match.slots, acceptedAfter)
          if (newStatus !== match.status) {
            await matchAdapter.updateStatus(match.id, newStatus)
          }
        }

        await refresh()
        return true
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al expulsar al jugador'))
        return false
      }
    },
    [match, getAcceptedCount, refresh],
  )

  // ── Cancel match ─────────────────────────────────────────────────────

  const cancelMatch = useCallback(async (): Promise<boolean> => {
    if (!match) return false
    try {
      await matchAdapter.updateStatus(match.id, 'cancelled')
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cancelar el partido'))
      return false
    }
  }, [match])

  // ── Attendance ──────────────────────────────────────────────────────

  const toggleAttendance = useCallback(
    async (playerId: string, attended: boolean): Promise<void> => {
      try {
        await attendanceAdapter.markAttendance(matchId, playerId, attended)
        const atts = await attendanceAdapter.getAttendanceForMatch(matchId)
        setAttendances(atts)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al guardar asistencia'))
      }
    },
    [matchId],
  )

  // ── Ratings ─────────────────────────────────────────────────────────

  const saveRating = useCallback(
    async (playerId: string, score: number): Promise<void> => {
      try {
        await ratingAdapter.ratePlayer(matchId, playerId, score)
        const rats = await ratingAdapter.getRatingsForMatch(matchId)
        setRatings(rats)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Error al guardar puntuación'))
      }
    },
    [matchId],
  )

  return {
    match: isOrganizer ? match : null,
    applications: isOrganizer ? applications : [],
    attendances: isOrganizer ? attendances : [],
    ratings: isOrganizer ? ratings : [],
    loading,
    error,
    refresh,
    acceptApplication,
    rejectApplication,
    kickApplication,
    toggleAttendance,
    saveRating,
    cancelMatch,
    isMatchEnded,
    isAttendanceCompleted,
  }
}

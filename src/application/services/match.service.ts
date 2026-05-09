import type { Match, MatchStatus } from '@domain/match'
import type { Application } from '@domain/application'

/**
 * Determine if a match should be auto-closed because its end_time has passed.
 *
 * Compares the match's date + end_time against the provided `now` date.
 * Already closed or cancelled matches are never re-processed.
 */
export function shouldAutoClose(match: Match, now: Date = new Date()): boolean {
  if (match.status === 'closed' || match.status === 'cancelled') return false

  const [year, month, day] = match.date.split('-').map(Number)
  const [hours, minutes] = match.end_time.split(':').map(Number)

  const matchEnd = new Date(year!, (month ?? 1) - 1, day, hours, minutes)
  return now.getTime() > matchEnd.getTime()
}

/**
 * Return the new status a match should have based on accepted applications.
 *
 * Rules:
 * - If acceptedCount >= slots → 'full'
 * - Otherwise → 'open'
 * - Already closed/cancelled matches are returned as-is.
 */
export function computeMatchStatus(
  currentStatus: MatchStatus,
  slots: number,
  acceptedCount: number,
): MatchStatus {
  if (currentStatus === 'closed' || currentStatus === 'cancelled') {
    return currentStatus
  }

  return acceptedCount >= slots ? 'full' : 'open'
}

/**
 * Count accepted applications from a list.
 */
export function countAccepted(applications: Application[]): number {
  return applications.filter((a) => a.status === 'accepted').length
}

/**
 * Simple boolean check: is the match full?
 */
export function isFull(slots: number, acceptedCount: number): boolean {
  return acceptedCount >= slots
}

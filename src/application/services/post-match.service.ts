import type { Match } from '@domain/match'

/**
 * Check whether post-match actions (attendance, ratings) can be performed.
 * Only available after the match end_time has passed.
 */
export function canPerformPostMatchActions(match: Match, now: Date = new Date()): boolean {
  if (!match) return false
  try {
    const [year, month, day] = match.date.split('-').map(Number)
    const [hours, minutes] = match.end_time.split(':').map(Number)
    if (year === undefined || month === undefined || day === undefined) return false
    const endDate = new Date(year, month - 1, day, hours ?? 0, minutes ?? 0)
    return now > endDate
  } catch {
    return false
  }
}

/**
 * Check whether a player can be rated — only accepted players.
 */
export function canRatePlayer(applicationStatus: string): boolean {
  return applicationStatus === 'accepted'
}

/**
 * Compute attendance rate from attendance records.
 * Returns percentage 0-100 of attended players out of confirmed ones.
 */
export function computeAttendanceRate(
  attendances: { attended: boolean }[],
  totalConfirmed: number,
): number {
  if (totalConfirmed === 0) return 0
  const attendedCount = attendances.filter((a) => a.attended).length
  return Math.round((attendedCount / totalConfirmed) * 100)
}

/**
 * Whether all confirmed (accepted) players have had their attendance marked.
 * Used to gate the ratings section — you rate only after attendance is done.
 */
export function allAttendanceMarked(
  acceptedPlayerIds: string[],
  attendances: { player_id: string }[],
): boolean {
  if (acceptedPlayerIds.length === 0) return false
  const attendedPlayerIds = new Set(attendances.map((a) => a.player_id))
  return acceptedPlayerIds.every((id) => attendedPlayerIds.has(id))
}

/**
 * Validate that a confidence score is in the 1-5 range.
 */
export function isValidConfidenceScore(score: number): boolean {
  return Number.isInteger(score) && score >= 1 && score <= 5
}

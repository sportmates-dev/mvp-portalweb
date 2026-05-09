import type { MatchStatus } from '@domain/match'

/**
 * Determine whether the organizer can accept another player.
 *
 * Rules:
 * - Cannot accept if there are no available slots (accepted >= slots).
 * - Match must be in a mutable state (open or full).
 */
export function canAccept(
  slots: number,
  acceptedCount: number,
  currentStatus: MatchStatus,
): boolean {
  if (currentStatus === 'closed' || currentStatus === 'cancelled') return false
  return acceptedCount < slots
}

/**
 * Compute the new match status after an application is accepted.
 *
 * - If acceptedCount + 1 >= slots → 'full'
 * - Otherwise → 'open'
 * - Already closed/cancelled matches are returned as-is.
 */
export function statusAfterAccept(
  currentStatus: MatchStatus,
  slots: number,
  acceptedBefore: number,
): MatchStatus {
  if (currentStatus === 'closed' || currentStatus === 'cancelled') {
    return currentStatus
  }
  return acceptedBefore + 1 >= slots ? 'full' : 'open'
}

/**
 * Compute the new match status after a player is kicked (or rejected
 * from an accepted state).
 *
 * - If acceptedAfter < slots and match was 'full' → 'open'
 * - Otherwise → unchanged
 * - Already closed/cancelled → as-is.
 */
export function statusAfterKick(
  currentStatus: MatchStatus,
  slots: number,
  acceptedAfter: number,
): MatchStatus {
  if (currentStatus === 'closed' || currentStatus === 'cancelled') {
    return currentStatus
  }
  if (currentStatus === 'full' && acceptedAfter < slots) {
    return 'open'
  }
  return currentStatus
}

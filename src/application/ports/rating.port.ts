import type { Rating } from '../../domain/rating'

export interface IRatingPort {
  /** Fetch all ratings for a match. */
  getRatingsForMatch(matchId: number): Promise<Rating[]>

  /** Rate a player with a confidence score 1-5 (UPSERT). */
  ratePlayer(matchId: number, playerId: string, score: number): Promise<void>
}

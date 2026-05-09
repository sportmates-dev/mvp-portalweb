import { supabase } from './client'
import type { IRatingPort } from '@application/ports/rating.port'
import type { Rating } from '@domain/rating'

/**
 * Rating adapter — implements IRatingPort.
 * Wraps Supabase ratings table queries.
 */
export const ratingAdapter: IRatingPort = {
  async getRatingsForMatch(matchId: number): Promise<Rating[]> {
    const { data, error } = await supabase
      .from('ratings')
      .select('*')
      .eq('match_id', matchId)

    if (error) throw error
    return (data as unknown as Rating[]) ?? []
  },

  async ratePlayer(
    matchId: number,
    playerId: string,
    score: number,
  ): Promise<void> {
    const { error } = await supabase
      .from('ratings')
      .upsert(
        { match_id: matchId, player_id: playerId, confidence_score: score },
        { onConflict: 'match_id,player_id' },
      )

    if (error) throw error
  },
}

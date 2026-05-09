import { supabase } from './client'
import type { IApplicationPort, ApplicationWithPlayer } from '@application/ports/match.port'
import type { ApplicationStatus } from '@domain/application'

// No generated Supabase types yet — cast to any for MVP
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (table: string): any => supabase.from(table)

/**
 * Application adapter — implements IApplicationPort.
 *
 * Attendance and ratings have been extracted to their own adapters:
 * @see attendance.adapter.ts
 * @see rating.adapter.ts
 */
export const applicationAdapter: IApplicationPort = {
  async applyToMatch(matchId: number, playerId: string): Promise<void> {
    const { error } = await from('applications')
      .upsert(
        { match_id: matchId, player_id: playerId, status: 'pending' },
        { onConflict: 'match_id,player_id' },
      )

    if (error) throw error
  },

  async getApplicationsForMatch(matchId: number): Promise<ApplicationWithPlayer[]> {
    const { data, error } = await from('applications')
      .select(`
        id, match_id, player_id, status, created_at,
        profiles:player_id (id, name, photo_url, position, role)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data as unknown as ApplicationWithPlayer[]) ?? []
  },

  async updateApplicationStatus(
    applicationId: number,
    status: ApplicationStatus,
  ): Promise<void> {
    const { error } = await from('applications')
      .update({ status })
      .eq('id', applicationId)

    if (error) throw error
  },
}

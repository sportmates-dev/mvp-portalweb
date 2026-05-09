import { supabase } from './client'
import type { IAttendancePort } from '@application/ports/attendance.port'
import type { Attendance } from '@domain/attendance'

/**
 * Attendance adapter — implements IAttendancePort.
 * Wraps Supabase attendances table queries.
 */
export const attendanceAdapter: IAttendancePort = {
  async getAttendanceForMatch(matchId: number): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendances')
      .select('*')
      .eq('match_id', matchId)

    if (error) throw error
    return (data as unknown as Attendance[]) ?? []
  },

  async markAttendance(
    matchId: number,
    playerId: string,
    attended: boolean,
  ): Promise<void> {
    const { error } = await supabase
      .from('attendances')
      .upsert(
        { match_id: matchId, player_id: playerId, attended },
        { onConflict: 'match_id,player_id' },
      )

    if (error) throw error
  },
}

import type { Attendance } from '../../domain/attendance'

export interface IAttendancePort {
  /** Fetch all attendance records for a match. */
  getAttendanceForMatch(matchId: number): Promise<Attendance[]>

  /** Mark a player as attended or not (UPSERT). */
  markAttendance(matchId: number, playerId: string, attended: boolean): Promise<void>
}

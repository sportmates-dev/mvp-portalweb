export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'kicked'

export interface Application {
  id: number
  match_id: number
  player_id: string
  status: ApplicationStatus
  created_at: string
}

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  kicked: 'Expulsado',
}

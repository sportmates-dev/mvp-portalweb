export type MatchStatus = 'open' | 'full' | 'closed' | 'cancelled'

export interface Match {
  id: number
  organizer_id: string
  date: string
  start_time: string
  end_time: string
  location: string
  description: string
  slots: number
  status: MatchStatus
  whatsapp_link: string | null
  created_at: string
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  open: 'Abierto',
  full: 'Completo',
  closed: 'Cerrado',
  cancelled: 'Cancelado',
}

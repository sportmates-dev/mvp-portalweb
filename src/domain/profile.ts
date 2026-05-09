export interface Profile {
  id: string
  name: string
  photo_url: string | null
  position: PlayerPosition | null
  role: UserRole
  created_at: string
}

export type PlayerPosition = 'arquero' | 'defensa' | 'mediocampista' | 'delantero'

export type UserRole = 'player' | 'organizer' | 'both'

export const PLAYER_POSITIONS: PlayerPosition[] = [
  'arquero',
  'defensa',
  'mediocampista',
  'delantero',
]

export const PLAYER_POSITION_LABELS: Record<PlayerPosition, string> = {
  arquero: 'Arquero',
  defensa: 'Defensa',
  mediocampista: 'Mediocampista',
  delantero: 'Delantero',
}

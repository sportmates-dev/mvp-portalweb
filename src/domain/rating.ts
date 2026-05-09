export interface Rating {
  id: number
  match_id: number
  player_id: string
  confidence_score: number // 1-5
  created_at: string
}

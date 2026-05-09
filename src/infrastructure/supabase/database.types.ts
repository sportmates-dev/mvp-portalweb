export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          photo_url: string | null
          position: string | null
          role: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          photo_url?: string | null
          position?: string | null
          role?: string
        }
        Update: {
          name?: string
          photo_url?: string | null
          position?: string | null
        }
      }
      matches: {
        Row: {
          id: number
          organizer_id: string
          date: string
          start_time: string
          end_time: string
          location: string
          description: string
          slots: number
          status: string
          whatsapp_link: string | null
          created_at: string
        }
        Insert: {
          organizer_id: string
          date: string
          start_time: string
          end_time: string
          location: string
          description?: string
          slots: number
          status?: string
          whatsapp_link?: string | null
        }
        Update: {
          date?: string
          start_time?: string
          end_time?: string
          location?: string
          description?: string
          slots?: number
          status?: string
          whatsapp_link?: string | null
        }
      }
      applications: {
        Row: {
          id: number
          match_id: number
          player_id: string
          status: string
          created_at: string
        }
        Insert: {
          match_id: number
          player_id: string
          status?: string
        }
        Update: {
          status?: string
        }
      }
      attendances: {
        Row: {
          id: number
          match_id: number
          player_id: string
          attended: boolean
        }
        Insert: {
          match_id: number
          player_id: string
          attended?: boolean
        }
        Update: {
          attended?: boolean
        }
      }
      ratings: {
        Row: {
          id: number
          match_id: number
          player_id: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          match_id: number
          player_id: string
          confidence_score: number
        }
        Update: {
          confidence_score?: number
        }
      }
    }
  }
}

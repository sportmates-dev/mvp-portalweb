import type { Profile } from '../../domain/profile'

export interface IProfilePort {
  get(userId: string): Promise<Profile | null>
  update(userId: string, data: UpdateProfileInput): Promise<Profile>
}

export interface UpdateProfileInput {
  name?: string
  position?: string | null
  photo_url?: string | null
}

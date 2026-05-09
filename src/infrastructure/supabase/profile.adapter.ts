import { supabase } from './client'
import type { IProfilePort, UpdateProfileInput } from '@application/ports/profile.port'
import type { Profile, PlayerPosition } from '@domain/profile'

/*
 * The database stores positions in English (goalkeeper, defender, midfielder,
 * forward) because of the CHECK constraint, but the domain layer and UI use
 * Spanish names. These maps keep the adapter as the translation boundary.
 */
const DB_TO_DOMAIN_POSITION: Record<string, PlayerPosition> = {
  goalkeeper: 'arquero',
  defender: 'defensa',
  midfielder: 'mediocampista',
  forward: 'delantero',
}

const DOMAIN_TO_DB_POSITION: Record<PlayerPosition, string> = {
  arquero: 'goalkeeper',
  defensa: 'defender',
  mediocampista: 'midfielder',
  delantero: 'forward',
}

function mapDbToDomainPosition(dbValue: string | null): PlayerPosition | null {
  if (!dbValue) return null
  return DB_TO_DOMAIN_POSITION[dbValue] ?? null
}

function mapDomainToDbPosition(domainValue: string | null): string | null {
  if (!domainValue) return null
  return DOMAIN_TO_DB_POSITION[domainValue as PlayerPosition] ?? null
}

export const profileAdapter: IProfilePort = {
  async get(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    if (!data) return null

    return {
      ...data,
      position: mapDbToDomainPosition(data.position),
    } as Profile
  },

  async update(userId, data: UpdateProfileInput) {
    const mappedData: UpdateProfileInput = { ...data }
    if (data.position !== undefined) {
      mappedData.position = mapDomainToDbPosition(data.position)
    }

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(mappedData)
      .eq('id', userId)
      .select('*')
      .single()

    if (error) throw error
    return {
      ...updated,
      position: mapDbToDomainPosition(updated.position),
    } as Profile
  },
}

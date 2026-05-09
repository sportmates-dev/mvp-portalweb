import { supabase } from './client'
import type { IStoragePort } from '@application/ports/storage.port'

export const storageAdapter: IStoragePort = {
  async upload(bucket, path, file) {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
    })
    if (error) throw error
    return path
  },

  getPublicUrl(bucket, path) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },
}

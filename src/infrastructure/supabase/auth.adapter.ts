import { supabase } from './client'
import type { IAuthPort } from '@application/ports/auth.port'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'

export const authAdapter: IAuthPort = {
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })
    if (error) throw error
    return { user: data.user }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return { user: data.user }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return { user: data.session?.user ?? null, session: data.session }
  },

  onAuthChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session)
    })
    return {
      unsubscribe: () => data.subscription.unsubscribe(),
    }
  },
}

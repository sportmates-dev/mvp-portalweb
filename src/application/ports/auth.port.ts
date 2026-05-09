import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export interface IAuthPort {
  signUp(email: string, password: string, name: string): Promise<{ user: User | null }>
  signIn(email: string, password: string): Promise<{ user: User | null }>
  signOut(): Promise<void>
  getSession(): Promise<{ user: User | null; session: Session | null }>
  onAuthChange(callback: (event: AuthChangeEvent, session: Session | null) => void): {
    unsubscribe: () => void
  }
}

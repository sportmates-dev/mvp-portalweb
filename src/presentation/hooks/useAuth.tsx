import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@domain/profile'
import { authAdapter } from '@infrastructure/supabase/auth.adapter'
import { profileAdapter } from '@infrastructure/supabase/profile.adapter'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const p = await profileAdapter.get(userId)
    setProfile(p)
  }, [])

  useEffect(() => {
    // Check existing session on mount
    authAdapter.getSession().then(({ user: currentUser }) => {
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      }
      setLoading(false)
    })

    // Listen for auth state changes
    const { unsubscribe } = authAdapter.onAuthChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        fetchProfile(currentUser.id)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchProfile])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { user: newUser } = await authAdapter.signUp(email, password, name)
    if (newUser) {
      setUser(newUser)
      // Profile auto-created by DB trigger — fetch it
      await fetchProfile(newUser.id)
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authAdapter.signIn(email, password)
    if (loggedInUser) {
      setUser(loggedInUser)
      await fetchProfile(loggedInUser.id)
    }
  }, [fetchProfile])

  const signOut = useCallback(async () => {
    await authAdapter.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

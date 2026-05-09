import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { useAuth } from './useAuth'
import { matchAdapter } from '@infrastructure/supabase/match.adapter'
import type { Match } from '@domain/match'
import type { MatchFilters } from '@application/ports/match.port'
import type { Application } from '@domain/application'
import type { ApplicationWithProfile, ApplicationWithMatch } from '@infrastructure/supabase/match.adapter'

/**
 * Fetch and return a list of matches, optionally filtered.
 * Runs auto-close on mount so expired matches are marked closed.
 */
export function useMatches(filters?: MatchFilters) {
  const { profile } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Extract filter values to primitives — avoids complex expressions in dep arrays
  const filterDate = filters?.date
  const filterLocation = filters?.location
  const filterStatusesKey = JSON.stringify(filters?.statuses ?? [])

  // ── Fetch with ref + setTimeout to avoid synchronous setState in effect ──

  const fetchRef = useRef<() => Promise<void>>(async () => {})

  // Sync ref outside render to avoid "refs during render" lint rule
  useLayoutEffect(() => {
    fetchRef.current = async () => {
      setLoading(true)
      setError(null)
      try {
        await matchAdapter.autoCloseExpired(new Date())
        const data = await matchAdapter.list(filters)
        setMatches(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch matches'))
      } finally {
        setLoading(false)
      }
    }
  })

  useEffect(() => {
    const id = setTimeout(() => {
      fetchRef.current()
    }, 0)
    return () => clearTimeout(id)
  }, [filterDate, filterLocation, filterStatusesKey])

  const fetchMatches = useCallback(() => fetchRef.current(), [])

  return {
    matches,
    loading,
    error,
    refresh: fetchMatches,
    isOrganizer: profile?.role === 'organizer' || profile?.role === 'both',
  }
}

/**
 * Fetch a single match with its applications and accepted players.
 * Enforces WhatsApp link visibility at the adapter level.
 */
export function useMatch(matchId: number) {
  const { user, profile } = useAuth()
  const [match, setMatch] = useState<Match | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [acceptedPlayers, setAcceptedPlayers] = useState<ApplicationWithProfile[]>([])
  const [myApplication, setMyApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const userId = user?.id

  // ── Fetch with ref + setTimeout to avoid synchronous setState in effect ──

  const fetchRef = useRef<() => Promise<void>>(async () => {})

  // Sync ref outside render to avoid "refs during render" lint rule
  useLayoutEffect(() => {
    fetchRef.current = async () => {
      setLoading(true)
      setError(null)
      try {
        await matchAdapter.autoCloseExpired(new Date())

        const m = await matchAdapter.getById(matchId)
        setMatch(m)

        if (m) {
          const [apps, accepted] = await Promise.all([
            matchAdapter.getApplications(matchId),
            matchAdapter.getAcceptedPlayers(matchId),
          ])
          setApplications(apps)
          setAcceptedPlayers(accepted)

          if (userId) {
            const myApp = await matchAdapter.getUserApplication(matchId, userId)
            setMyApplication(myApp)
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch match'))
      } finally {
        setLoading(false)
      }
    }
  })

  useEffect(() => {
    const id = setTimeout(() => {
      fetchRef.current()
    }, 0)
    return () => clearTimeout(id)
  }, [matchId, userId])

  const fetchMatch = useCallback(() => fetchRef.current(), [])

  const isOrganizer = profile?.id === match?.organizer_id
  const isAccepted = myApplication?.status === 'accepted'
  const canSeeWhatsApp = isOrganizer || isAccepted

  /**
   * Enforce WhatsApp link visibility on the client side.
   * Only organizer and accepted players can see it — spec requirement.
   */
  const sanitizedMatch = match
    ? {
        ...match,
        whatsapp_link: canSeeWhatsApp ? match.whatsapp_link : null,
      }
    : null

  return {
    match: sanitizedMatch,
    applications,
    acceptedPlayers,
    myApplication,
    loading,
    error,
    refresh: fetchMatch,
    isOrganizer,
    isAccepted,
    canSeeWhatsApp,
  }
}

/**
 * Mutation hook to create a new match.
 */
export function useCreateMatch() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const userId = user?.id

  const createMatch = useCallback(
    async (data: {
      date: string
      start_time: string
      end_time: string
      location: string
      description?: string
      slots: number
      whatsapp_link?: string
    }): Promise<Match | null> => {
      if (!userId) return null
      setLoading(true)
      setError(null)
      try {
        const match = await matchAdapter.create({
          organizer_id: userId,
          ...data,
        })
        return match
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create match'))
        return null
      } finally {
        setLoading(false)
      }
    },
    [userId],
  )

  return { createMatch, loading, error }
}

/**
 * Mutation hook to apply to a match.
 */
export function useApplyToMatch(matchId: number) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const userId = user?.id

  const apply = useCallback(async (): Promise<boolean> => {
    if (!userId) return false
    setLoading(true)
    setError(null)
    try {
      await matchAdapter.applyToMatch(matchId, userId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to apply to match'))
      return false
    } finally {
      setLoading(false)
    }
  }, [matchId, userId])

  return { apply, loading, error }
}

/**
 * Fetch all applications the current user has made (any status),
 * with joined match data. Used by MyMatches page.
 */
export function useMyMatches() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<ApplicationWithMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const userId = user?.id

  // ── Fetch with ref + setTimeout to avoid synchronous setState in effect ──

  const fetchRef = useRef<() => Promise<void>>(async () => {})

  // Sync ref outside render to avoid "refs during render" lint rule
  useLayoutEffect(() => {
    fetchRef.current = async () => {
      if (!userId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const data = await matchAdapter.getPlayerApplications(userId)
        setApplications(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch your matches'))
      } finally {
        setLoading(false)
      }
    }
  })

  useEffect(() => {
    const id = setTimeout(() => {
      fetchRef.current()
    }, 0)
    return () => clearTimeout(id)
  }, [userId])

  const fetchMyMatches = useCallback(() => fetchRef.current(), [])

  return { applications, loading, error, refresh: fetchMyMatches }
}

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { initPostHog, capturePageView } from '@infrastructure/analytics/posthog'

function PostHogPageTracker({ children }: { children: React.ReactNode }) {
  const location = useLocation()

  useEffect(() => {
    capturePageView(location.pathname)
  }, [location.pathname])

  return <>{children}</>
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  return (
    <AuthProvider>
      <PostHogPageTracker>
        {children}
      </PostHogPageTracker>
    </AuthProvider>
  )
}

import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { AppProviders } from '@presentation/providers'
import { Navbar } from '@presentation/components/layout/Navbar'
import { ProtectedRoute } from '@presentation/components/layout/ProtectedRoute'
import { LandingPage } from '@presentation/pages/Landing'
import { LoginPage } from '@presentation/pages/Login'
import { RegisterPage } from '@presentation/pages/Register'
import { ProfilePage } from '@presentation/pages/Profile'
import { CreateMatchPage } from '@presentation/pages/CreateMatch'
import { MatchDetailPage } from '@presentation/pages/MatchDetail'
import { MyMatchesPage } from '@presentation/pages/MyMatches'
import { ManageMatchPage } from '@presentation/pages/ManageMatch'

/**
 * Layout: Navbar at top, page content below via <Outlet />
 */
function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-gris-bg dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

/**
 * Root application component.
 *
 * ┌──────────────────────────────────────────────────────────┐
 * │ BrowserRouter                                            │
 * │  └─ AppProviders (AuthProvider + PostHogPageTracker)     │
 * │      └─ Routes                                           │
 * │          └─ Route element={<Layout />}                    │
 * │              ├─ /                   → Landing (public)    │
 * │              ├─ /login              → Login (public)      │
 * │              ├─ /register           → Register (public)   │
 * │              ├─ /profile            → Profile (protected) │
 * │              ├─ /matches/create     → CreateMatch         │
 * │              ├─ /matches/:id        → MatchDetail (auth)  │
 * │              ├─ /matches/:id/manage → ManageMatch         │
 * │              └─ /my-matches         → MyMatches (auth)    │
 * └──────────────────────────────────────────────────────────┘
 */
export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route element={<Layout />}>
            {/* Public routes */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />

            {/* Protected routes — require authentication */}
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Match Lifecycle (Phase 3-4) — protected */}
            <Route
              path="matches/create"
              element={
                <ProtectedRoute>
                  <CreateMatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="matches/:id"
              element={
                <ProtectedRoute>
                  <MatchDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="matches/:id/manage"
              element={
                <ProtectedRoute>
                  <ManageMatchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="my-matches"
              element={
                <ProtectedRoute>
                  <MyMatchesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </AppProviders>
    </BrowserRouter>
  )
}

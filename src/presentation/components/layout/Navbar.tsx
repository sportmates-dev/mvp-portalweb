import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { LogOut, PlusCircle, ListOrdered, Home } from 'lucide-react'

export function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const baseNavItem =
    'h-9 inline-flex items-center gap-1.5 px-3 rounded-lg text-sm font-semibold transition-colors duration-150'

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gris-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center">
            <img src="/favicon.svg" alt="SportMates" className="h-8 w-auto" />
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/"
                className={`${baseNavItem} ${
                  isActive('/')
                    ? 'text-verde-primary'
                    : 'text-gray-600 hover:text-verde-primary hover:bg-gray-50'
                }`}
              >
                <Home className="w-4 h-4" />
                Partidos
              </Link>
              <Link
                to="/my-matches"
                className={`${baseNavItem} ${
                  isActive('/my-matches')
                    ? 'text-verde-primary'
                    : 'text-gray-600 hover:text-verde-primary hover:bg-gray-50'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Mis Partidos
              </Link>
              <Link
                to="/matches/create"
                className={`${baseNavItem} bg-verde-primary hover:bg-verde-bright text-white`}
              >
                <PlusCircle className="w-4 h-4" />
                Crear
              </Link>
            </div>
          )}
        </div>

        {/* Right: Auth or user menu */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                to="/profile"
                className={`flex items-center gap-2 text-sm transition-colors ${
                  location.pathname === '/profile'
                    ? 'text-verde-primary font-semibold'
                    : 'text-gray-700 hover:text-verde-primary'
                }`}
              >
                <Avatar
                  src={profile?.photo_url}
                  name={profile?.name ?? user.email ?? 'Usuario'}
                  size="sm"
                />
                <span className="hidden sm:inline font-medium">
                  {profile?.name ?? 'Perfil'}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-rojo-alert transition-colors p-1 rounded-lg"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Iniciar sesión</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary">Registrarse</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

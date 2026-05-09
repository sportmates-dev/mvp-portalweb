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

  /** Highlight the active nav link. */
  function linkClass(path: string): string {
    const isActive = location.pathname === path
    return `text-sm transition-colors flex items-center gap-1 ${
      isActive
        ? 'text-verde-primary font-semibold'
        : 'text-gray-600 hover:text-verde-primary'
    }`
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gris-border shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo + nav links */}
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-verde-primary">
            SportMates
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/" className={linkClass('/')}>
                <Home className="w-4 h-4" />
                Partidos
              </Link>
              <Link to="/my-matches" className={linkClass('/my-matches')}>
                <ListOrdered className="w-4 h-4" />
                Mis Partidos
              </Link>
              <Link to="/matches/create">
                <Button variant="primary" className="!py-1.5 !px-3 !text-xs !min-h-0 !rounded-lg">
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Crear
                </Button>
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

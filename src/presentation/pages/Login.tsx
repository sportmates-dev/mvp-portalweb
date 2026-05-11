import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ArrowLeft } from 'lucide-react'

export function LoginPage() {
  const { user, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12 bg-gris-bg dark:bg-dark-bg transition-colors duration-200">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-dark-text-muted hover:text-verde-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>

        <Card>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
              Ingresá a tu cuenta de SportMates
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full rounded-lg border border-gris-border dark:border-dark-border bg-white dark:bg-dark-surface px-4 py-2.5 text-sm
                  text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-dark-text mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                className="w-full rounded-lg border border-gris-border dark:border-dark-border bg-white dark:bg-dark-surface px-4 py-2.5 text-sm
                  text-gray-900 dark:text-dark-text placeholder:text-gray-400 dark:placeholder:text-dark-text-muted
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  min-h-[44px]"
              />
            </div>

            {error && (
              <p className="text-sm text-rojo-alert">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500 dark:text-dark-text-muted">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-verde-primary hover:underline font-medium">
              Registrate
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}

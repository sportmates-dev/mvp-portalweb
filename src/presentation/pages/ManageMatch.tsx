import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useManageMatch } from '../hooks/useApplications'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { MATCH_STATUS_LABELS } from '@domain/match'
import { APPLICATION_STATUS_LABELS } from '@domain/application'
import type { ApplicationStatus } from '@domain/application'
import { PLAYER_POSITION_LABELS } from '@domain/profile'
import type { PlayerPosition } from '@domain/profile'
import {
  ArrowLeft, Calendar, Clock, MapPin, Users,
  MessageCircle, Loader2, CheckCircle, XCircle,
  UserX, ClipboardCheck, Star,
} from 'lucide-react'

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year ?? ''}`
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

function statusBadgeVariant(status: string): 'green' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'open': return 'green'
    case 'full': return 'gray'
    case 'closed': return 'orange'
    case 'cancelled': return 'red'
    default: return 'gray'
  }
}

function appStatusVariant(status: string): 'green' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'accepted': return 'green'
    case 'pending': return 'orange'
    case 'rejected': return 'red'
    case 'kicked': return 'red'
    default: return 'gray'
  }
}

/**
 * Organizer dashboard — manage applications, attendance, and ratings for a match.
 *
 * Sections:
 * 1. Match summary + WhatsApp link
 * 2. Applications with accept / reject / kick actions
 * 3. Post-match attendance + ratings (only visible after end_time)
 */
export function ManageMatchPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const matchId = Number(id)

  const {
    match,
    applications,
    attendances,
    ratings,
    loading,
    error,
    refresh,
    acceptApplication,
    rejectApplication,
    kickApplication,
    toggleAttendance,
    saveRating,
    cancelMatch,
    isMatchEnded,
    isAttendanceCompleted,
  } = useManageMatch(matchId)

  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    document.title = match
      ? `Gestionar — ${match.location} — SportMates`
      : 'Gestionar Partido — SportMates'
  }, [match])

  // ── Action wrappers with loading state ──────────────────────────────

  const handleAccept = async (app: (typeof applications)[number]) => {
    setActionLoading(app.id)
    await acceptApplication(app)
    setActionLoading(null)
  }

  const handleReject = async (app: (typeof applications)[number]) => {
    setActionLoading(app.id)
    await rejectApplication(app)
    setActionLoading(null)
  }

  const handleKick = async (app: (typeof applications)[number]) => {
    setActionLoading(app.id)
    await kickApplication(app)
    setActionLoading(null)
  }

  const handleCancelMatch = async () => {
    if (!window.confirm('¿Estás seguro de que querés eliminar este partido?')) return
    setCancelling(true)
    const ok = await cancelMatch()
    if (ok) {
      navigate('/')
      return
    }
    setCancelling(false)
  }

  // ── Loading ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-verde-primary" />
      </div>
    )
  }

  // ── Error / not-found ───────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="text-center max-w-md w-full py-8">
          <p className="text-rojo-alert">{error.message}</p>
          <Button variant="ghost" className="mt-4" onClick={refresh}>
            Reintentar
          </Button>
        </Card>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="text-center max-w-md w-full py-8">
          <h2 className="text-xl font-semibold text-gray-900">Partido no encontrado</h2>
          <p className="mt-2 text-sm text-gray-500">
            No tenés acceso a este partido o no existe.
          </p>
          <Button variant="primary" className="mt-4" onClick={() => navigate('/')}>
            Volver al inicio
          </Button>
        </Card>
      </div>
    )
  }

  // ── Derived data ────────────────────────────────────────────────────

  const acceptedCount = applications.filter((a) => a.status === 'accepted').length
  const pendingCount = applications.filter((a) => a.status === 'pending').length
  const isClosedOrCancelled = match.status === 'closed' || match.status === 'cancelled'

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-verde-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* ── 1. Match summary ──────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Partido en {match.location}
            </h1>
            <Badge variant={statusBadgeVariant(match.status)}>
              {MATCH_STATUS_LABELS[match.status]}
            </Badge>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{formatTime(match.start_time)} — {formatTime(match.end_time)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{match.location}</span>
            </div>
          </div>

          {/* Slot progress */}
          <div className="mt-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Cupos ocupados</span>
                <span className="font-semibold text-gray-900">
                  {acceptedCount} / {match.slots}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-verde-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((acceptedCount / match.slots) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp link — always visible to organizer */}
          {match.whatsapp_link && (
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  Grupo de WhatsApp
                </span>
              </div>
              <a
                href={match.whatsapp_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-700 underline hover:text-green-900 break-all"
              >
                {match.whatsapp_link}
              </a>
            </div>
          )}

          {/* Link back to match detail */}
          <div className="mt-4 flex items-center justify-between">
            <Link
              to={`/matches/${match.id}`}
              className="text-sm text-azul-primary hover:text-blue-700 font-medium"
            >
              Ver página del partido →
            </Link>
            {!isClosedOrCancelled && (
              <Button
                variant="danger"
                onClick={handleCancelMatch}
                loading={cancelling}
              >
                Eliminar partido
              </Button>
            )}
          </div>
        </Card>

        {/* ── 2. Applications ───────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Postulaciones
            </h2>
            {pendingCount > 0 && (
              <Badge variant="orange">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</Badge>
            )}
          </div>

          {applications.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <p className="text-sm">Nadie se postuló todavía.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {applications.map((app) => {
                const player = app.profiles
                const playerName = player?.name ?? 'Jugador'
                const playerPosition = (player?.position ?? null) as PlayerPosition | null

                return (
                  <div
                    key={app.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gris-border bg-gray-50/50"
                  >
                    {/* Avatar + name + position */}
                    <Avatar
                      src={player?.photo_url ?? null}
                      name={playerName}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {playerName}
                      </p>
                      {playerPosition && (
                        <p className="text-xs text-gray-500">
                          {PLAYER_POSITION_LABELS[playerPosition]}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <Badge variant={appStatusVariant(app.status)}>
                      {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus]}
                    </Badge>

                    {/* Actions */}
                    {!isClosedOrCancelled && (
                      <div className="flex items-center gap-1.5">
                        {app.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAccept(app)}
                              disabled={actionLoading === app.id}
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                              title="Aceptar"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(app)}
                              disabled={actionLoading === app.id}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 transition-colors"
                              title="Rechazar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {app.status === 'accepted' && (
                          <button
                            onClick={() => handleKick(app)}
                            disabled={actionLoading === app.id}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            title="Expulsar"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        )}

                        {app.status === 'rejected' && (
                          <span className="text-xs text-gray-400 italic">
                            Puede volver a postularse
                          </span>
                        )}

                        {app.status === 'kicked' && (
                          <span className="text-xs text-gray-400 italic">Expulsado</span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* ── 3. Post-match: Attendance ──────────────────────────────── */}
        {isMatchEnded && (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Asistencia</h2>
            </div>

            {applications.filter((a) => a.status === 'accepted').length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No hubo jugadores confirmados en este partido.
              </p>
            ) : (
              <div className="space-y-2">
                {applications
                  .filter((a) => a.status === 'accepted')
                  .map((app) => {
                    const player = app.profiles
                    const playerName = player?.name ?? 'Jugador'
                    const attendance = attendances.find(
                      (a) => a.player_id === app.player_id,
                    )
                    const attended = attendance?.attended ?? false

                    return (
                      <label
                        key={app.player_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gris-border bg-gray-50/50 cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={attended}
                          onChange={(e) =>
                            toggleAttendance(app.player_id, e.target.checked)
                          }
                          className="w-5 h-5 rounded border-gray-300 text-verde-primary focus:ring-verde-primary accent-verde-primary"
                        />
                        <Avatar
                          src={player?.photo_url ?? null}
                          name={playerName}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {playerName}
                        </span>
                        {attended && (
                          <span className="text-xs text-green-600 font-medium ml-auto">
                            Presente
                          </span>
                        )}
                      </label>
                    )
                  })}
              </div>
            )}
          </Card>
        )}

        {/* ── 4. Post-match: Ratings (only after attendance complete) ──── */}
        {isMatchEnded && isAttendanceCompleted && (
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-gray-900">Puntuaciones</h2>
              <span className="text-xs text-gray-400 ml-1">(1 a 5)</span>
            </div>

            {applications.filter((a) => a.status === 'accepted').length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No hubo jugadores confirmados en este partido.
              </p>
            ) : (
              <div className="space-y-3">
                {applications
                  .filter((a) => a.status === 'accepted')
                  .map((app) => {
                    const player = app.profiles
                    const playerName = player?.name ?? 'Jugador'
                    const rating = ratings.find(
                      (r) => r.player_id === app.player_id,
                    )
                    const currentScore = rating?.confidence_score ?? 0

                    return (
                      <div
                        key={app.player_id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gris-border bg-gray-50/50"
                      >
                        <Avatar
                          src={player?.photo_url ?? null}
                          name={playerName}
                          size="sm"
                        />
                        <span className="text-sm font-medium text-gray-900 flex-1 min-w-0 truncate">
                          {playerName}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              onClick={() => saveRating(app.player_id, score)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors min-h-[32px]
                                ${currentScore >= score
                                  ? 'text-amber-500 hover:text-amber-600'
                                  : 'text-gray-300 hover:text-amber-400'
                                }`}
                              title={`${score} estrella${score !== 1 ? 's' : ''}`}
                            >
                              <Star
                                className="w-5 h-5"
                                fill={currentScore >= score ? 'currentColor' : 'none'}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </Card>
        )}

        {/* ── 5. Attendance pending hint ──────────────────────────────── */}
        {isMatchEnded && !isAttendanceCompleted && applications.filter((a) => a.status === 'accepted').length > 0 && (
          <Card className="mb-6 text-center text-gray-400 py-6">
            <p className="text-sm">
              Marcá la asistencia de todos los jugadores para habilitar las puntuaciones.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

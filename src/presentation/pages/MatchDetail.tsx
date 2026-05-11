import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMatch, useApplyToMatch } from "../hooks/useMatches";
import { useAuth } from "../hooks/useAuth";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { MATCH_STATUS_LABELS } from "@domain/match";
import { APPLICATION_STATUS_LABELS } from "@domain/application";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Users,
  MessageCircle,
  Loader2,
  Settings,
} from "lucide-react";

function statusBadgeVariant(
  status: string,
): "green" | "orange" | "red" | "gray" {
  switch (status) {
    case "open":
      return "green";
    case "full":
      return "gray";
    case "closed":
      return "orange";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}

function appStatusVariant(status: string): "green" | "orange" | "red" | "gray" {
  switch (status) {
    case "accepted":
      return "green";
    case "pending":
      return "orange";
    case "rejected":
      return "red";
    case "kicked":
      return "red";
    default:
      return "gray";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year ?? ""}`;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const matchId = Number(id);
  const { user } = useAuth();
  const {
    match,
    acceptedPlayers,
    myApplication,
    loading,
    error,
    refresh,
    isOrganizer,
    canSeeWhatsApp,
  } = useMatch(matchId);
  const { apply, loading: applying } = useApplyToMatch(matchId);
  const [justApplied, setJustApplied] = useState(false);

  useEffect(() => {
    document.title = match
      ? `Partido en ${match.location} — SportMates`
      : "Partido — SportMates";
  }, [match]);

  const handleApply = async () => {
    const success = await apply();
    if (success) {
      setJustApplied(true);
      refresh();
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-verde-primary" />
      </div>
    );
  }

  // Error state
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
    );
  }

  // Not found
  if (!match) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <Card className="text-center max-w-md w-full py-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-dark-text">
            Partido no encontrado
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
            El partido que buscas no existe o fue eliminado.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate("/")}
          >
            Ver partidos disponibles
          </Button>
        </Card>
      </div>
    );
  }

  const acceptedCount = acceptedPlayers.length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-dark-text-muted hover:text-verde-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        {/* Match header card */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">
              Partido en {match.location}
            </h1>
            <Badge variant={statusBadgeVariant(match.status)}>
              {MATCH_STATUS_LABELS[match.status]}
            </Badge>
          </div>

          {/* Organizer manage link */}
          {isOrganizer && match.status !== "cancelled" && (
            <div className="mt-3">
              <Link
                to={`/matches/${match.id}/manage`}
                className="inline-flex items-center gap-1.5 text-sm text-azul-primary hover:text-blue-700 font-medium"
              >
                <Settings className="w-4 h-4" />
                Gestionar partido
              </Link>
            </div>
          )}

          {/* Match details */}
          <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-dark-text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {formatTime(match.start_time)} — {formatTime(match.end_time)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{match.location}</span>
            </div>
            {match.description && (
              <div className="flex items-start gap-2">
                <AlignLeft className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>{match.description}</span>
              </div>
            )}
          </div>

          {/* Slot counter */}
          <div className="mt-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-dark-text-muted">Cupos</span>
                <span className="font-semibold text-gray-900 dark:text-dark-text">
                  {acceptedCount} / {match.slots}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-verde-primary rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((acceptedCount / match.slots) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Accepted players */}
        {acceptedPlayers.length > 0 && (
          <Card className="mb-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-dark-text mb-3">
              Jugadores confirmados ({acceptedPlayers.length})
            </h2>
            <div className="flex flex-wrap gap-3">
              {acceptedPlayers.map((ap) => (
                <div key={ap.player_id} className="flex items-center gap-2">
                  <Avatar
                    src={ap.profiles?.photo_url ?? null}
                    name={ap.profiles?.name ?? "Jugador"}
                    size="sm"
                  />
                  <span className="text-sm text-gray-700 dark:text-dark-text">
                    {ap.profiles?.name ?? "Jugador"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* WhatsApp link — only for accepted players and organizer */}
        {canSeeWhatsApp && match.whatsapp_link && (
          <Card className="mb-6 border-verde-primary/30 bg-green-50/50 dark:bg-green-900/20 dark:border-green-700/30">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Grupo de WhatsApp
                </p>
                <a
                  href={match.whatsapp_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-700 underline hover:text-green-900 break-all"
                >
                  {match.whatsapp_link}
                </a>
              </div>
            </div>
          </Card>
        )}

        {/* Application status card — for non-organizers */}
        {!isOrganizer && user && match.status === "open" && (
          <Card>
            {myApplication ? (
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <Badge variant={appStatusVariant(myApplication.status)}>
                    {APPLICATION_STATUS_LABELS[myApplication.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-dark-text-muted">
                  {myApplication.status === "pending" &&
                    "Tu postulación está pendiente de revisión."}
                  {myApplication.status === "accepted" &&
                    "¡Fuiste aceptado! Revisá el grupo de WhatsApp."}
                  {myApplication.status === "rejected" &&
                    "Tu postulación fue rechazada. Podés volver a postularte."}
                  {myApplication.status === "kicked" &&
                    "Fuiste expulsado del partido."}
                </p>
                {(myApplication.status === "rejected" ||
                  myApplication.status === "kicked") && (
                  <Button
                    variant="primary"
                    className="mt-3"
                    loading={applying}
                    onClick={handleApply}
                  >
                    Volver a postularme
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-dark-text-muted mb-4">
                  ¿Querés jugar este partido? Postulate y el organizador
                  revisará tu perfil.
                </p>
                <Button
                  variant="primary"
                  className="w-full"
                  loading={applying}
                  disabled={justApplied && !myApplication}
                  onClick={handleApply}
                >
                  {justApplied && !myApplication
                    ? "Postulación enviada"
                    : "Postularme"}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Closed/cancelled — no actions */}
        {(match.status === "closed" || match.status === "cancelled") &&
          !isOrganizer && (
            <Card className="text-center text-gray-400 dark:text-dark-text-muted py-6">
              <p className="text-sm">
                {match.status === "closed"
                  ? "Este partido ya terminó."
                  : "Este partido fue cancelado."}
              </p>
            </Card>
          )}
      </div>
    </div>
  );
}

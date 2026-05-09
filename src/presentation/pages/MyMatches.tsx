import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMyMatches } from "../hooks/useMatches";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { MATCH_STATUS_LABELS } from "@domain/match";
import { APPLICATION_STATUS_LABELS } from "@domain/application";
import type { ApplicationStatus } from "@domain/application";
import { Calendar, MapPin, Users, Loader2, Trophy } from "lucide-react";

type Tab = "pending" | "confirmed";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year ?? ""}`;
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  return timeStr.slice(0, 5);
}

function matchStatusVariant(
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

export function MyMatchesPage() {
  const { applications, loading, error, refresh } = useMyMatches();
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  useEffect(() => {
    document.title = "Mis Partidos — SportMates";
  }, []);

  const pendingApps = applications.filter((a) => a.status === "pending");
  const confirmedApps = applications.filter((a) => a.status === "accepted");
  const displayedApps = activeTab === "pending" ? pendingApps : confirmedApps;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Partidos</h1>

        {/* Tabs */}
        <div className="flex border-b border-gris-border mb-6">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors min-h-[44px]
              ${
                activeTab === "pending"
                  ? "border-verde-primary text-verde-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Postulados
            {pendingApps.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-verde-primary/10 text-xs text-verde-primary font-bold">
                {pendingApps.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("confirmed")}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors min-h-[44px]
              ${
                activeTab === "confirmed"
                  ? "border-verde-primary text-verde-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
          >
            Confirmados
            {confirmedApps.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-xs text-green-700 font-bold">
                {confirmedApps.length}
              </span>
            )}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-verde-primary" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="text-center py-8">
            <p className="text-rojo-alert text-sm mb-4">{error.message}</p>
            <Button variant="ghost" onClick={refresh}>
              Reintentar
            </Button>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !error && displayedApps.length === 0 && (
          <Card className="text-center text-gray-400 py-12">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {activeTab === "pending"
                ? "No tenés postulaciones pendientes. ¡Busca un partido y postulate!"
                : "No tenés partidos confirmados todavía."}
            </p>
            <Link to="/">
              <Button variant="primary" className="mt-4">
                Ver partidos disponibles
              </Button>
            </Link>
          </Card>
        )}

        {/* Application cards */}
        {!loading && !error && displayedApps.length > 0 && (
          <div className="space-y-3">
            {displayedApps.map((app) => {
              const match = app.matches;
              if (!match) return null;

              return (
                <Link
                  key={`${app.match_id}-${app.player_id}`}
                  to={`/matches/${app.match_id}`}
                  className="block"
                >
                  <Card
                    onClick={() => {}}
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          Partido en {match.location}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(match.date)} —{" "}
                            {formatTime(match.start_time)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {match.location}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {match.slots} cupos
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <Badge variant={matchStatusVariant(match.status)}>
                          {MATCH_STATUS_LABELS[match.status] ?? match.status}
                        </Badge>
                        <Badge variant={appStatusVariant(app.status)}>
                          {APPLICATION_STATUS_LABELS[app.status as ApplicationStatus] ?? app.status}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

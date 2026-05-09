import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMatches } from "../hooks/useMatches";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { MatchCard } from "../components/match/MatchCard";
import {
  PlusCircle,
  Users,
  Trophy,
  MapPin,
  Calendar,
  Loader2,
} from "lucide-react";

export function LandingPage() {
  const { user } = useAuth();
  const { matches, loading, error, refresh, isOrganizer } = useMatches({
    statuses: ["open", "full"],
  });
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    document.title = "SportMates — Encuentra tu partido";
  }, []);

  // Filter by location and date on client side
  const filteredMatches = matches.filter((m) => {
    if (
      locationFilter &&
      !m.location.toLowerCase().includes(locationFilter.toLowerCase())
    ) {
      return false;
    }
    if (dateFilter && m.date !== dateFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero section */}
      <section className="bg-verde-primary text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <Trophy className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Encuentra Tu Partido de Fútbol
          </h1>
          <p className="mt-4 text-lg text-white/80 max-w-xl mx-auto">
            La forma más fácil de organizar y unirte a partidos de fútbol 7.
            Publica, postula y juega.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              isOrganizer ? (
                <Link to="/matches/create">
                  <Button
                    variant="secondary"
                    className="!bg-white !text-verde-primary !hover:bg-gray-100"
                  >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Crear un partido
                  </Button>
                </Link>
              ) : (
                <p className="text-white/70 text-sm">
                  Busca un partido y postulate para jugar
                </p>
              )
            ) : (
              <>
                <Link to="/register">
                  <Button
                    variant="secondary"
                    className="!bg-white !text-verde-primary hover:!bg-gray-100"
                  >
                    Comenzar gratis
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="!text-white !border-white/50 hover:!bg-white/10"
                  >
                    Ya tengo cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Matches section */}
      <section className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Partidos disponibles
            </h2>
            <span className="text-sm text-gray-500">
              {filteredMatches.length} partido
              {filteredMatches.length !== 1 && "s"}
            </span>
          </div>

          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Location filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Filtrar por zona..."
                className="w-full rounded-lg border border-gris-border pl-10 pr-4 py-2.5 text-sm
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  min-h-[44px]"
              />
            </div>

            {/* Date filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full rounded-lg border border-gris-border pl-10 pr-4 py-2.5 text-sm
                  text-gray-900 placeholder:text-gray-400
                  focus:outline-none focus:ring-2 focus:ring-verde-primary focus:border-transparent
                  min-h-[44px]"
              />
            </div>
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

          {/* Empty state — no matches at all */}
          {!loading && !error && filteredMatches.length === 0 && (
            <Card className="text-center text-gray-400 py-12">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {locationFilter || dateFilter
                  ? "No hay partidos que coincidan con los filtros seleccionados."
                  : "No hay partidos disponibles"}
              </p>
              {isOrganizer && !locationFilter && !dateFilter && (
                <Link to="/matches/create">
                  <Button variant="primary" className="mt-4">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Crear el primer partido
                  </Button>
                </Link>
              )}
            </Card>
          )}

          {/* Match cards */}
          {!loading && !error && filteredMatches.length > 0 && (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <Link
                  key={match.id}
                  to={`/matches/${match.id}`}
                  className="block"
                >
                  <MatchCard match={match} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features section — only on initial state */}
      {!user && (
        <section className="py-12 px-4 bg-gray-50/50">
          <div className="max-w-3xl mx-auto grid sm:grid-cols-3 gap-6">
            <Card className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-verde-primary/10 mb-4">
                <MapPin className="w-6 h-6 text-verde-primary" />
              </div>
              <h3 className="font-semibold text-gray-900">
                Encuentra partidos
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Busca partidos cerca tuyo y postulate para jugar. Filtra por
                zona y fecha.
              </p>
            </Card>
            <Card className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-verde-primary/10 mb-4">
                <PlusCircle className="w-6 h-6 text-verde-primary" />
              </div>
              <h3 className="font-semibold text-gray-900">Organiza partidos</h3>
              <p className="mt-2 text-sm text-gray-500">
                Publica tus partidos y gestiona a los jugadores. Acepta, rechaza
                y arma a tu equipo.
              </p>
            </Card>
            <Card className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-verde-primary/10 mb-4">
                <Users className="w-6 h-6 text-verde-primary" />
              </div>
              <h3 className="font-semibold text-gray-900">Juega con pasión</h3>
              <p className="mt-2 text-sm text-gray-500">
                Conoce a nuevos jugadores, sigue tu historial y construye tu
                reputación en la cancha.
              </p>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}

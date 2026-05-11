import type { Match } from '@domain/match'
import { MATCH_STATUS_LABELS } from '@domain/match'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Users, MapPin, Calendar } from 'lucide-react'

interface MatchCardProps {
  match: Match
  onClick?: () => void
}

function statusBadgeVariant(status: string): 'green' | 'orange' | 'red' | 'gray' {
  switch (status) {
    case 'open':
      return 'green'
    case 'full':
      return 'gray'
    case 'closed':
      return 'orange'
    case 'cancelled':
      return 'red'
    default:
      return 'gray'
  }
}

function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${day}/${month}`
}

export function MatchCard({ match, onClick }: MatchCardProps) {
  const availableSlots = match.slots // TODO: compute from accepted applications

  return (
    <Card onClick={onClick}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-dark-text truncate">
            Partido en {match.location}
          </h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-dark-text-muted">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(match.date)} — {match.start_time.slice(0, 5)}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {match.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" />
              {availableSlots} cupos
            </span>
          </div>

          {match.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-dark-text-muted line-clamp-2">
              {match.description}
            </p>
          )}
        </div>

        <Badge variant={statusBadgeVariant(match.status)}>
          {MATCH_STATUS_LABELS[match.status]}
        </Badge>
      </div>
    </Card>
  )
}

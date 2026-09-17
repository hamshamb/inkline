export type DateBucket = 'Pinned' | 'Today' | 'Yesterday' | 'Previous 7 days' | 'Older'

function startOfDay(ts: number): number {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Buckets a timestamp relative to now for sidebar grouping (excludes Pinned). */
export function bucketFor(updatedAt: number, now = Date.now()): Exclude<DateBucket, 'Pinned'> {
  const today = startOfDay(now)
  const yesterday = today - 86_400_000
  const weekAgo = today - 7 * 86_400_000

  if (updatedAt >= today) return 'Today'
  if (updatedAt >= yesterday) return 'Yesterday'
  if (updatedAt >= weekAgo) return 'Previous 7 days'
  return 'Older'
}

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** Short, human-friendly relative/absolute label for sidebar rows. */
export function formatUpdatedAt(ts: number, now = Date.now()): string {
  const diffMs = ts - now
  const diffMin = Math.round(diffMs / 60_000)

  if (Math.abs(diffMin) < 1) return 'just now'
  if (Math.abs(diffMin) < 60) return relativeFormatter.format(diffMin, 'minute')

  const diffHr = Math.round(diffMin / 60)
  if (Math.abs(diffHr) < 24 && startOfDay(ts) === startOfDay(now)) {
    return timeFormatter.format(ts)
  }
  if (startOfDay(ts) === startOfDay(now) - 86_400_000) {
    return `Yesterday, ${timeFormatter.format(ts)}`
  }
  return dateFormatter.format(ts)
}

export function formatFullTimestamp(ts: number): string {
  return fullDateFormatter.format(ts)
}

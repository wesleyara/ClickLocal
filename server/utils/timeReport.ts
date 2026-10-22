export const REPORT_GROUPS = ['day', 'board', 'tag', 'card'] as const
export type ReportGroupBy = (typeof REPORT_GROUPS)[number]

export interface ReportEntry {
  startedAt: Date
  endedAt: Date | null
  durationMs: number | null
  card: {
    id: number
    title: string
    board: { id: number, name: string }
    tags: { id: number, name: string }[]
  }
}

export interface ReportGroup {
  key: string
  label: string
  durationMs: number
  entryCount: number
  /** Only for `groupBy=day`: the day's time split per board, longest first. */
  boards?: { id: number, label: string, durationMs: number }[]
  /** Only for `groupBy=card`: the board the card lives on. */
  boardId?: number
}

export interface TimeReport {
  groupBy: ReportGroupBy
  totalMs: number
  entryCount: number
  groups: ReportGroup[]
}

/** Raised for an invalid query parameter — the endpoint turns it into a 400. */
export class ReportQueryError extends Error {}

export function isReportGroup(value: string): value is ReportGroupBy {
  return (REPORT_GROUPS as readonly string[]).includes(value)
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** `YYYY-MM-DD` is a local calendar day (the `to` bound is inclusive, so it resolves to the start of the next day); anything else must be a full ISO instant. */
export function parseReportBound(raw: string, bound: 'from' | 'to'): Date {
  if (DATE_ONLY.test(raw)) {
    const [year, month, day] = raw.split('-').map(Number) as [number, number, number]
    const start = new Date(year, month - 1, day)
    if (dayKey(start) !== raw) throw new ReportQueryError(`"${bound}" is not a valid date`)
    return bound === 'to' ? new Date(year, month - 1, day + 1) : start
  }
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) throw new ReportQueryError(`"${bound}" is not a valid date`)
  return date
}

/** Comma separated positive ids, e.g. `1,2,3`. */
export function parseIdList(raw: string | undefined): number[] {
  if (!raw) return []
  return raw.split(',').map((part) => {
    if (!/^\d+$/.test(part.trim())) throw new ReportQueryError(`invalid id "${part}"`)
    return Number(part)
  })
}

/** Local calendar day of an instant, as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** A finished entry has its stored duration; a running one counts until `now`. */
export function entryDurationMs(entry: Pick<ReportEntry, 'startedAt' | 'durationMs'>, now: Date): number {
  if (entry.durationMs !== null) return entry.durationMs
  return Math.max(now.getTime() - entry.startedAt.getTime(), 0)
}

function groupsOf(entry: ReportEntry, groupBy: ReportGroupBy): { key: string, label: string }[] {
  switch (groupBy) {
    case 'day':
      return [{ key: dayKey(entry.startedAt), label: dayKey(entry.startedAt) }]
    case 'board':
      return [{ key: String(entry.card.board.id), label: entry.card.board.name }]
    case 'card':
      return [{ key: String(entry.card.id), label: entry.card.title }]
    case 'tag':
      return entry.card.tags.length
        ? entry.card.tags.map(tag => ({ key: String(tag.id), label: tag.name }))
        : [{ key: 'none', label: 'Sem tag' }]
  }
}

/**
 * Sums tracked time per group. An entry belongs to the day of its `startedAt`.
 * Grouping by tag credits the full duration to every tag of the card, so the groups may add up to more than `totalMs`.
 */
export function aggregateTimeEntries(entries: ReportEntry[], groupBy: ReportGroupBy, now: Date = new Date()): TimeReport {
  const groups = new Map<string, ReportGroup>()
  let totalMs = 0

  for (const entry of entries) {
    const durationMs = entryDurationMs(entry, now)
    totalMs += durationMs

    for (const { key, label } of groupsOf(entry, groupBy)) {
      const group = groups.get(key) ?? { key, label, durationMs: 0, entryCount: 0 }
      group.durationMs += durationMs
      group.entryCount += 1
      if (groupBy === 'card') group.boardId = entry.card.board.id
      groups.set(key, group)

      if (groupBy === 'day') {
        const boards = group.boards ??= []
        const { id, name } = entry.card.board
        const board = boards.find(b => b.id === id)
        if (board) board.durationMs += durationMs
        else boards.push({ id, label: name, durationMs })
      }
    }
  }

  for (const group of groups.values()) group.boards?.sort((a, b) => b.durationMs - a.durationMs)

  const sorted = [...groups.values()].sort((a, b) =>
    groupBy === 'day' ? a.key.localeCompare(b.key) : b.durationMs - a.durationMs || a.label.localeCompare(b.label))

  return { groupBy, totalMs, entryCount: entries.length, groups: sorted }
}

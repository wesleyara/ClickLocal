export type ReportGroupBy = 'day' | 'board' | 'tag' | 'card'
export type ReportPreset = 'today' | 'week' | 'month' | 'custom'

export interface ReportGroup {
  key: string
  label: string
  durationMs: number
  entryCount: number
  boards?: { id: number, label: string, durationMs: number }[]
  boardId?: number
}

export interface TimeReport {
  groupBy: ReportGroupBy
  totalMs: number
  entryCount: number
  groups: ReportGroup[]
}

export interface ReportFilters {
  preset: ReportPreset
  /** `YYYY-MM-DD`, local calendar day (only used by the custom preset). */
  from: string
  to: string
  boardId: number | null
  tagIds: number[]
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Inclusive local-day range of a preset; the week runs Monday to Sunday in the browser's timezone. */
export function presetRange(preset: Exclude<ReportPreset, 'custom'>, today = new Date()): { from: string, to: string } {
  const y = today.getFullYear()
  const m = today.getMonth()
  const d = today.getDate()
  if (preset === 'today') return { from: toDayKey(today), to: toDayKey(today) }
  if (preset === 'month') return { from: toDayKey(new Date(y, m, 1)), to: toDayKey(new Date(y, m + 1, 0)) }
  const sinceMonday = (today.getDay() + 6) % 7
  return { from: toDayKey(new Date(y, m, d - sinceMonday)), to: toDayKey(new Date(y, m, d - sinceMonday + 6)) }
}

/** Every local day from `from` to `to` (inclusive, `YYYY-MM-DD`), so empty days show up in the chart. */
export function daysBetween(from: string, to: string): string[] {
  const [fy, fm, fd] = from.split('-').map(Number) as [number, number, number]
  const [ty, tm, td] = to.split('-').map(Number) as [number, number, number]
  const end = new Date(ty, tm - 1, td)
  const days: string[] = []
  for (let day = new Date(fy, fm - 1, fd); day <= end && days.length < 400; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
    days.push(toDayKey(day))
  }
  return days
}

export function formatDuration(ms: number) {
  const totalMinutes = Math.round(ms / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes}min`
  return `${hours}h${pad(minutes)}`
}

export function useTimeReport() {
  const initial = presetRange('week')
  const filters = reactive<ReportFilters>({ preset: 'week', from: initial.from, to: initial.to, boardId: null, tagIds: [] })

  const byDay = ref<TimeReport | null>(null)
  const table = ref<TimeReport | null>(null)
  const tableGroupBy = ref<Exclude<ReportGroupBy, 'day'>>('board')
  const pending = ref(false)
  const error = ref<string | null>(null)

  function setPreset(preset: ReportPreset) {
    filters.preset = preset
    if (preset !== 'custom') Object.assign(filters, presetRange(preset))
  }

  function query(groupBy: ReportGroupBy) {
    return {
      groupBy,
      from: filters.from,
      to: filters.to,
      boardId: filters.boardId ?? undefined,
      tagIds: filters.tagIds.length ? filters.tagIds.join(',') : undefined
    }
  }

  let requestId = 0
  async function refresh() {
    if (!filters.from || !filters.to || filters.from > filters.to) {
      error.value = 'Intervalo inválido'
      return
    }
    const current = ++requestId
    pending.value = true
    error.value = null
    try {
      const [days, grouped] = await Promise.all([
        $fetch<TimeReport>('/api/reports/time', { query: query('day') }),
        $fetch<TimeReport>('/api/reports/time', { query: query(tableGroupBy.value) })
      ])
      if (current !== requestId) return
      byDay.value = days
      table.value = grouped
    } catch {
      if (current === requestId) error.value = 'Não foi possível carregar o relatório'
    } finally {
      if (current === requestId) pending.value = false
    }
  }

  watch([filters, tableGroupBy], refresh, { deep: true })

  return { filters, byDay, table, tableGroupBy, pending, error, setPreset, refresh }
}

import { reportRepository, type TimeEntryFilter } from '../repositories/reportRepository'
import { aggregateTimeEntries, type ReportGroupBy } from '../utils/timeReport'

export async function getTimeReport(filter: TimeEntryFilter, groupBy: ReportGroupBy) {
  const rows = await reportRepository.findTimeEntries(filter)
  const entries = rows.map(({ card: { column, tags, ...card }, ...entry }) => ({
    ...entry,
    card: { ...card, board: column.board, tags: tags.map(t => t.tag) }
  }))

  return {
    from: filter.from?.toISOString() ?? null,
    to: filter.to?.toISOString() ?? null,
    ...aggregateTimeEntries(entries, groupBy)
  }
}

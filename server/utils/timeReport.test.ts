import { describe, expect, it } from 'vitest'
import {
  aggregateTimeEntries,
  entryDurationMs,
  parseIdList,
  parseReportBound,
  ReportQueryError,
  type ReportEntry
} from './timeReport'

const NOW = new Date(2026, 9, 22, 12, 0, 0)
const HOUR = 3_600_000

function entry(overrides: Partial<ReportEntry> & { cardId?: number, tags?: ReportEntry['card']['tags'], boardId?: number } = {}): ReportEntry {
  const { cardId = 1, tags = [], boardId = 1, ...rest } = overrides
  return {
    startedAt: new Date(2026, 9, 20, 9, 0, 0),
    endedAt: new Date(2026, 9, 20, 10, 0, 0),
    durationMs: HOUR,
    card: { id: cardId, title: `Card ${cardId}`, board: { id: boardId, name: `Board ${boardId}` }, tags },
    ...rest
  }
}

describe('entryDurationMs', () => {
  it('uses the stored duration of a finished entry', () => {
    expect(entryDurationMs(entry({ durationMs: 5000 }), NOW)).toBe(5000)
  })

  it('counts a running entry until now', () => {
    const running = entry({ startedAt: new Date(2026, 9, 22, 10, 0, 0), endedAt: null, durationMs: null })
    expect(entryDurationMs(running, NOW)).toBe(2 * HOUR)
  })
})

describe('aggregateTimeEntries', () => {
  it('groups by the day the entry started, even when it crosses midnight', () => {
    const overnight = entry({ startedAt: new Date(2026, 9, 20, 23, 0, 0), durationMs: 3 * HOUR })
    const nextDay = entry({ startedAt: new Date(2026, 9, 21, 9, 0, 0), durationMs: HOUR })

    const report = aggregateTimeEntries([nextDay, overnight], 'day', NOW)

    expect(report.groups).toEqual([
      { key: '2026-10-20', label: '2026-10-20', durationMs: 3 * HOUR, entryCount: 1, boards: [{ id: 1, label: 'Board 1', durationMs: 3 * HOUR }] },
      { key: '2026-10-21', label: '2026-10-21', durationMs: HOUR, entryCount: 1, boards: [{ id: 1, label: 'Board 1', durationMs: HOUR }] }
    ])
    expect(report.totalMs).toBe(4 * HOUR)
  })

  it('includes the running timer up to now', () => {
    const running = entry({ startedAt: new Date(2026, 9, 22, 11, 0, 0), endedAt: null, durationMs: null })
    expect(aggregateTimeEntries([running], 'day', NOW).totalMs).toBe(HOUR)
  })

  it('groups by board, largest first', () => {
    const report = aggregateTimeEntries([
      entry({ boardId: 1, durationMs: HOUR }),
      entry({ boardId: 2, durationMs: 2 * HOUR }),
      entry({ boardId: 1, durationMs: HOUR })
    ], 'board', NOW)

    expect(report.groups.map(g => [g.label, g.durationMs, g.entryCount])).toEqual([
      ['Board 1', 2 * HOUR, 2],
      ['Board 2', 2 * HOUR, 1]
    ])
  })

  it('groups by card', () => {
    const report = aggregateTimeEntries([entry({ cardId: 1 }), entry({ cardId: 2, durationMs: 3 * HOUR }), entry({ cardId: 1 })], 'card', NOW)
    expect(report.groups.map(g => g.label)).toEqual(['Card 2', 'Card 1'])
  })

  it('credits the full duration to every tag, so the groups may exceed the total', () => {
    const tags = [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
    const report = aggregateTimeEntries([entry({ tags }), entry({ cardId: 2, tags: [] })], 'tag', NOW)

    expect(report.totalMs).toBe(2 * HOUR)
    expect(report.groups.map(g => [g.label, g.durationMs])).toEqual([
      ['A', HOUR],
      ['B', HOUR],
      ['Sem tag', HOUR]
    ])
    expect(report.groups.reduce((sum, g) => sum + g.durationMs, 0)).toBeGreaterThan(report.totalMs)
  })

  it('returns an empty report without entries', () => {
    expect(aggregateTimeEntries([], 'day', NOW)).toEqual({ groupBy: 'day', totalMs: 0, entryCount: 0, groups: [] })
  })
})

describe('parseReportBound', () => {
  it('reads a plain date as a local day, with an inclusive `to`', () => {
    expect(parseReportBound('2026-10-20', 'from')).toEqual(new Date(2026, 9, 20))
    expect(parseReportBound('2026-10-20', 'to')).toEqual(new Date(2026, 9, 21))
  })

  it('accepts a full ISO instant as is', () => {
    expect(parseReportBound('2026-10-20T12:00:00.000Z', 'from')).toEqual(new Date('2026-10-20T12:00:00.000Z'))
  })

  it('rejects invalid dates', () => {
    expect(() => parseReportBound('2026-02-31', 'from')).toThrow(ReportQueryError)
    expect(() => parseReportBound('abc', 'to')).toThrow(ReportQueryError)
  })
})

describe('parseIdList', () => {
  it('parses comma separated ids', () => {
    expect(parseIdList('1, 2,3')).toEqual([1, 2, 3])
    expect(parseIdList(undefined)).toEqual([])
  })

  it('rejects anything that is not an id', () => {
    expect(() => parseIdList('1,x')).toThrow(ReportQueryError)
  })
})

describe('aggregateTimeEntries day breakdown', () => {
  it('splits each day per board', () => {
    const report = aggregateTimeEntries([
      entry({ boardId: 1, durationMs: HOUR }),
      entry({ boardId: 2, durationMs: 2 * HOUR }),
      entry({ boardId: 1, durationMs: HOUR })
    ], 'day', NOW)
    expect(report.groups[0]!.boards).toEqual([
      { id: 1, label: 'Board 1', durationMs: 2 * HOUR },
      { id: 2, label: 'Board 2', durationMs: 2 * HOUR }
    ])
  })

  it('has no breakdown for other groupings', () => {
    expect(aggregateTimeEntries([entry()], 'board', NOW).groups[0]!.boards).toBeUndefined()
  })
})

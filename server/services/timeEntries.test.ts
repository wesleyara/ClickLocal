import { beforeEach, describe, expect, it, vi } from 'vitest'

const findRunning = vi.fn()
const findById = vi.fn()
const create = vi.fn()
const update = vi.fn()
const logActivity = vi.fn()
const tx = { tx: true }

vi.mock('../repositories/timeEntryRepository', () => ({
  timeEntryRepository: { findRunning, findById, create, update }
}))

vi.mock('../utils/activity', () => ({ logActivity }))

vi.mock('../utils/db', () => ({
  db: { $transaction: (fn: (client: unknown) => unknown) => fn(tx) }
}))

const { getRunningTimer, startTimer, stopTimer, TimerAlreadyRunningError } = await import('./timeEntries')

function runningEntry(id: number, cardId: number, startedAt: Date) {
  return {
    id,
    cardId,
    startedAt,
    endedAt: null,
    durationMs: null,
    card: { id: cardId, title: `Card ${cardId}`, column: { board: { id: 9, name: 'Board' } } }
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.useRealTimers()
  findRunning.mockResolvedValue([])
  create.mockImplementation(async data => ({ id: 100, ...data }))
  update.mockImplementation(async (id, data) => ({ id, ...data }))
})

describe('getRunningTimer', () => {
  it('returns null when nothing is running', async () => {
    expect(await getRunningTimer()).toBeNull()
  })

  it('returns the running entry with its card and board', async () => {
    const startedAt = new Date('2026-10-22T10:00:00Z')
    findRunning.mockResolvedValue([runningEntry(1, 5, startedAt)])

    expect(await getRunningTimer()).toEqual({
      id: 1,
      cardId: 5,
      startedAt,
      endedAt: null,
      durationMs: null,
      card: { id: 5, title: 'Card 5' },
      board: { id: 9, name: 'Board' }
    })
  })
})

describe('startTimer', () => {
  it('starts a timer when none is running', async () => {
    await startTimer(7)

    expect(findRunning).toHaveBeenCalledWith(tx)
    expect(update).not.toHaveBeenCalled()
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ source: 'timer', card: { connect: { id: 7 } } }), tx)
  })

  it('refuses to start while another timer runs without stopOthers', async () => {
    findRunning.mockResolvedValue([runningEntry(1, 5, new Date())])

    await expect(startTimer(7)).rejects.toBeInstanceOf(TimerAlreadyRunningError)
    expect(update).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
  })

  it('stops every running timer in the same transaction with stopOthers', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T11:00:00Z'))
    findRunning.mockResolvedValue([
      runningEntry(1, 5, new Date('2026-10-22T10:00:00Z')),
      runningEntry(2, 6, new Date('2026-10-22T10:30:00Z'))
    ])

    await startTimer(7, { stopOthers: true })

    const now = new Date('2026-10-22T11:00:00Z')
    expect(update).toHaveBeenCalledWith(1, { endedAt: now, durationMs: 3_600_000 }, tx)
    expect(update).toHaveBeenCalledWith(2, { endedAt: now, durationMs: 1_800_000 }, tx)
    expect(logActivity).toHaveBeenCalledWith(5, 'time_entry_added', { durationMs: 3_600_000, source: 'timer' }, tx)
    expect(logActivity).toHaveBeenCalledWith(6, 'time_entry_added', { durationMs: 1_800_000, source: 'timer' }, tx)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ startedAt: now, card: { connect: { id: 7 } } }), tx)
  })
})

describe('stopTimer', () => {
  it('closes the entry and logs its duration', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-22T10:05:00Z'))
    findById.mockResolvedValue({ id: 3, cardId: 5, startedAt: new Date('2026-10-22T10:00:00Z') })

    await stopTimer(3)

    expect(update).toHaveBeenCalledWith(3, { endedAt: new Date('2026-10-22T10:05:00Z'), durationMs: 300_000 }, tx)
    expect(logActivity).toHaveBeenCalledWith(5, 'time_entry_added', { durationMs: 300_000, source: 'timer' }, tx)
  })
})

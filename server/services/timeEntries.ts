import { timeEntryRepository } from '../repositories/timeEntryRepository'
import { logActivity } from '../utils/activity'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export function listEntries(cardId: number) {
  return timeEntryRepository.findByCardId(cardId)
}

export async function getRunningTimer() {
  const [running] = await timeEntryRepository.findRunning()
  if (!running) return null

  const { card, ...entry } = running
  return { ...entry, card: { id: card.id, title: card.title }, board: card.column.board }
}

export class TimerAlreadyRunningError extends Error {}

/** Only one timer may run at a time: with `stopOthers` any running timer is closed in the same transaction, otherwise starting fails. */
export function startTimer(cardId: number, options: { stopOthers?: boolean } = {}) {
  return db.$transaction(async (tx) => {
    const running = await timeEntryRepository.findRunning(tx)
    if (running.length && !options.stopOthers) {
      throw new TimerAlreadyRunningError(`Já existe um timer rodando em "${running[0]!.card.title}"`)
    }

    const endedAt = new Date()
    for (const entry of running) {
      await closeTimer(entry, endedAt, tx)
    }

    return timeEntryRepository.create({
      startedAt: endedAt,
      source: 'timer',
      card: { connect: { id: cardId } }
    }, tx)
  })
}

async function closeTimer(entry: { id: number, cardId: number, startedAt: Date }, endedAt: Date, tx: DbClient) {
  const durationMs = endedAt.getTime() - entry.startedAt.getTime()
  const updated = await timeEntryRepository.update(entry.id, { endedAt, durationMs }, tx)
  await logActivity(entry.cardId, 'time_entry_added', { durationMs, source: 'timer' }, tx)
  return updated
}

export async function stopTimer(id: number) {
  const entry = await timeEntryRepository.findById(id)
  if (!entry) throw new Error('Time entry not found')

  return db.$transaction(tx => closeTimer(entry, new Date(), tx))
}

export function addManualEntry(cardId: number, input: { startedAt: string, durationMs: number, note?: string }) {
  const startedAt = new Date(input.startedAt)
  const endedAt = new Date(startedAt.getTime() + input.durationMs)

  return db.$transaction(async (tx) => {
    const entry = await timeEntryRepository.create({
      startedAt,
      endedAt,
      durationMs: input.durationMs,
      source: 'manual',
      note: input.note?.trim() || null,
      card: { connect: { id: cardId } }
    }, tx)
    await logActivity(cardId, 'time_entry_added', { durationMs: input.durationMs, source: 'manual' }, tx)
    return entry
  })
}

export class PushedTimeEntryError extends Error {}

export async function updateManualEntry(id: number, input: { startedAt?: string, durationMs?: number, note?: string }) {
  const existing = await timeEntryRepository.findById(id)
  if (!existing) throw new Error('Time entry not found')
  if (existing.adoPushedAt) throw new PushedTimeEntryError('Horas já enviadas ao Azure DevOps não podem ser editadas')

  const startedAt = input.startedAt ? new Date(input.startedAt) : existing.startedAt
  const durationMs = input.durationMs ?? existing.durationMs ?? 0
  const endedAt = new Date(startedAt.getTime() + durationMs)

  return timeEntryRepository.update(id, {
    startedAt,
    endedAt,
    durationMs,
    ...(input.note !== undefined ? { note: input.note.trim() || null } : {})
  })
}

export async function deleteEntry(id: number) {
  const existing = await timeEntryRepository.findById(id)
  if (!existing) throw new Error('Time entry not found')
  if (existing.adoPushedAt) throw new PushedTimeEntryError('Horas já enviadas ao Azure DevOps não podem ser excluídas')

  await timeEntryRepository.delete(id)
}

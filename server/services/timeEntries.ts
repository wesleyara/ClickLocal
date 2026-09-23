import { timeEntryRepository } from '../repositories/timeEntryRepository'
import { logActivity } from '../utils/activity'
import { db } from '../utils/db'

export function listEntries(cardId: number) {
  return timeEntryRepository.findByCardId(cardId)
}

export function startTimer(cardId: number) {
  return timeEntryRepository.create({
    startedAt: new Date(),
    source: 'timer',
    card: { connect: { id: cardId } }
  })
}

export async function stopTimer(id: number) {
  const entry = await timeEntryRepository.findById(id)
  if (!entry) throw new Error('Time entry not found')

  const endedAt = new Date()
  const durationMs = endedAt.getTime() - entry.startedAt.getTime()

  return db.$transaction(async (tx) => {
    const updated = await timeEntryRepository.update(id, { endedAt, durationMs }, tx)
    await logActivity(entry.cardId, 'time_entry_added', { durationMs, source: 'timer' }, tx)
    return updated
  })
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

import { subtaskRepository } from '../repositories/subtaskRepository'
import { logActivity } from '../utils/activity'
import { db } from '../utils/db'
import { nextPosition } from '../utils/position'

export async function createSubtask(cardId: number, input: { title: string }) {
  const last = await subtaskRepository.findLastByPosition(cardId)
  const title = input.title.trim()

  return db.$transaction(async (tx) => {
    const subtask = await subtaskRepository.create({
      title,
      position: nextPosition(last?.position),
      card: { connect: { id: cardId } }
    }, tx)
    await logActivity(cardId, 'subtask_added', { title }, tx)
    return subtask
  })
}

export async function updateSubtask(id: number, input: { title?: string, completed?: boolean }) {
  const existing = await subtaskRepository.findById(id)
  if (!existing) throw new Error('Subtask not found')

  return db.$transaction(async (tx) => {
    const updated = await subtaskRepository.update(id, input, tx)

    if (input.completed !== undefined && input.completed !== existing.completed) {
      const eventType = input.completed ? 'subtask_completed' : 'subtask_reopened'
      await logActivity(existing.cardId, eventType, { title: existing.title }, tx)
    }

    return updated
  })
}

export async function deleteSubtask(id: number) {
  const existing = await subtaskRepository.findById(id)
  if (!existing) throw new Error('Subtask not found')

  await db.$transaction(async (tx) => {
    await subtaskRepository.delete(id, tx)
    await logActivity(existing.cardId, 'subtask_removed', { title: existing.title }, tx)
  })
}

export function reorderSubtasks(updates: { id: number, position: number }[]) {
  return subtaskRepository.updatePositions(updates)
}

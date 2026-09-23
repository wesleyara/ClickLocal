import type { Prisma } from '@prisma/client'
import { azureDevOpsRepository } from '../repositories/azureDevOpsRepository'
import { cardRepository } from '../repositories/cardRepository'
import { pushStateForMoves } from './azureDevOps/state'
import { logActivity } from '../utils/activity'
import { db } from '../utils/db'
import { nextPosition } from '../utils/position'

export async function getCard(id: number) {
  const card = await cardRepository.findByIdWithRelations(id)
  if (!card) return null

  const { tags, children, ado, ...rest } = card
  const adoWithType = ado
    ? { ...ado, supportsCompletedWork: (await azureDevOpsRepository.findType(ado.project, ado.type))?.supportsCompletedWork ?? true }
    : null

  return {
    ...rest,
    ado: adoWithType,
    tags: tags.map(t => t.tag),
    children: children.map(({ tags: childTags, subtasks, _count, ...child }) => ({
      ...child,
      tags: childTags.map(t => t.tag),
      subtaskCount: subtasks.length,
      subtaskDoneCount: subtasks.filter(s => s.completed).length,
      childCount: _count.children
    }))
  }
}

export async function createCard(columnId: number, input: { title: string, description?: string | null }) {
  const last = await cardRepository.findLastByPosition(columnId)
  const title = input.title.trim()

  return db.$transaction(async (tx) => {
    const card = await cardRepository.create({
      title,
      description: input.description?.trim() || null,
      position: nextPosition(last?.position),
      column: { connect: { id: columnId } }
    }, tx)
    await logActivity(card.id, 'card_created', { title }, tx)
    return card
  })
}

export async function createChildCard(parentId: number, input: { title: string }) {
  const parent = await cardRepository.findById(parentId)
  if (!parent) throw new Error('Parent card not found')

  const last = await cardRepository.findLastByPosition(parent.columnId)
  const title = input.title.trim()

  return db.$transaction(async (tx) => {
    const card = await cardRepository.create({
      title,
      position: nextPosition(last?.position),
      column: { connect: { id: parent.columnId } },
      parent: { connect: { id: parentId } }
    }, tx)
    await logActivity(card.id, 'card_created', { title }, tx)
    await logActivity(parentId, 'child_card_added', { title }, tx)
    return card
  })
}

export async function updateCard(id: number, input: {
  title?: string
  description?: string | null
  columnId?: number
  position?: number
  dueDate?: string | null
  archived?: boolean
}) {
  const existing = await cardRepository.findById(id)
  if (!existing) throw new Error('Card not found')

  const linked = await azureDevOpsRepository.findWorkItemByCardId(id)

  const data: Prisma.CardUpdateInput = {}
  if (input.title !== undefined && !linked) data.title = input.title.trim()
  if (input.description !== undefined && !linked) data.description = input.description || null
  if (input.columnId !== undefined) data.column = { connect: { id: input.columnId } }
  if (input.position !== undefined) data.position = input.position
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null
  if (input.archived !== undefined) data.archived = input.archived

  return db.$transaction(async (tx) => {
    const updated = await cardRepository.update(id, data, tx)

    if (input.title !== undefined && updated.title !== existing.title) {
      await logActivity(id, 'title_changed', { from: existing.title, to: updated.title }, tx)
    }
    if (input.description !== undefined && updated.description !== existing.description) {
      await logActivity(id, 'description_changed', undefined, tx)
    }
    if (input.columnId !== undefined && input.columnId !== existing.columnId) {
      await logActivity(id, 'moved_column', { fromColumnId: existing.columnId, toColumnId: input.columnId }, tx)
    }
    if (input.dueDate !== undefined) {
      const from = existing.dueDate?.toISOString() ?? null
      const to = updated.dueDate?.toISOString() ?? null
      if (from !== to) await logActivity(id, 'due_date_changed', { from, to }, tx)
    }
    if (input.archived !== undefined && input.archived !== existing.archived) {
      await logActivity(id, input.archived ? 'card_archived' : 'card_unarchived', undefined, tx)
    }

    return updated
  })
}

export class LinkedCardError extends Error {}

export async function deleteCard(id: number) {
  const linked = await azureDevOpsRepository.findWorkItemByCardId(id)
  if (linked) {
    throw new LinkedCardError('Card vinculado ao Azure DevOps não pode ser excluído, só arquivado')
  }
  await cardRepository.delete(id)
}

export async function reorderCards(updates: { id: number, columnId: number, position: number }[]) {
  const existing = await cardRepository.findManyByIds(updates.map(u => u.id))
  const previousById = new Map(existing.map(c => [c.id, c]))

  const moves = updates
    .map(u => ({ cardId: u.id, fromColumnId: previousById.get(u.id)?.columnId, toColumnId: u.columnId }))
    .filter((m): m is { cardId: number, fromColumnId: number, toColumnId: number } => m.fromColumnId !== undefined)

  const { failures } = await pushStateForMoves(moves)
  const failedIds = new Set(failures.map(f => f.cardId))

  const applied = updates.filter(u => !failedIds.has(u.id))
  const reverted = updates.filter(u => failedIds.has(u.id))

  await db.$transaction(async (tx) => {
    if (applied.length > 0) await cardRepository.updatePositions(applied, tx)

    for (const update of applied) {
      const previous = previousById.get(update.id)
      if (previous && previous.columnId !== update.columnId) {
        await logActivity(update.id, 'moved_column', { fromColumnId: previous.columnId, toColumnId: update.columnId }, tx)
      }
    }

    for (const update of reverted) {
      const previous = previousById.get(update.id)!
      await cardRepository.update(update.id, {
        column: { connect: { id: previous.columnId } },
        position: previous.position
      }, tx)
    }
  })

  return { failures }
}

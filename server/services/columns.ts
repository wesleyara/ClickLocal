import type { Prisma } from '@prisma/client'
import { columnRepository } from '../repositories/columnRepository'
import { nextPosition } from '../utils/position'

export async function createColumn(boardId: number, input: { name: string }) {
  const last = await columnRepository.findLastByPosition(boardId)

  return columnRepository.create({
    name: input.name.trim(),
    position: nextPosition(last?.position),
    board: { connect: { id: boardId } }
  })
}

export function updateColumn(id: number, input: { name?: string, color?: string }) {
  const data: Prisma.BoardColumnUpdateInput = {}
  if (input.name !== undefined) data.name = input.name.trim()
  if (input.color !== undefined) data.color = input.color

  return columnRepository.update(id, data)
}

export async function deleteColumn(id: number) {
  await columnRepository.delete(id)
}

export function reorderColumns(updates: { id: number, position: number }[]) {
  return columnRepository.updatePositions(updates)
}

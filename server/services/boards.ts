import type { Prisma } from '@prisma/client'
import { boardRepository } from '../repositories/boardRepository'
import { nextPosition } from '../utils/position'

export async function listBoards() {
  const boards = await boardRepository.findMany()

  return boards.map(({ _count, columns, ...board }) => ({
    ...board,
    columnCount: _count.columns,
    cardCount: columns.reduce((sum, c) => sum + c._count.cards, 0)
  }))
}

export function getBoard(id: number) {
  return boardRepository.findById(id)
}

export async function createBoard(input: { name: string, description?: string | null }) {
  const last = await boardRepository.findLastByPosition()

  return boardRepository.create({
    name: input.name.trim(),
    description: input.description?.trim() || null,
    position: nextPosition(last?.position)
  })
}

export function updateBoard(id: number, input: { name?: string, description?: string | null }) {
  const data: Prisma.BoardUpdateInput = {}
  if (input.name !== undefined) data.name = input.name.trim()
  if (input.description !== undefined) data.description = input.description?.trim() || null

  return boardRepository.update(id, data)
}

export async function deleteBoard(id: number) {
  await boardRepository.delete(id)
}

export function listArchivedCards(boardId: number) {
  return boardRepository.findArchivedCards(boardId)
}

export async function getBoardFull(id: number) {
  const board = await boardRepository.findByIdWithColumnsAndCards(id)
  if (!board) return null

  const { columns, ...rest } = board
  return {
    board: rest,
    columns: columns.map(column => ({
      ...column,
      cards: column.cards.map(({ subtasks, tags, timeEntries, _count, ...card }) => ({
        ...card,
        subtaskCount: subtasks.length,
        subtaskDoneCount: subtasks.filter(s => s.completed).length,
        childCount: _count.children,
        tags: tags.map(t => t.tag),
        hasRunningTimer: timeEntries.length > 0,
        runningTimerStartedAt: timeEntries[0]?.startedAt ?? null
      }))
    }))
  }
}

import type { Prisma } from '@prisma/client'
import { db } from '../utils/db'

export const columnRepository = {
  findById(id: number) {
    return db.boardColumn.findUnique({ where: { id } })
  },

  findLastByPosition(boardId: number) {
    return db.boardColumn.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
  },

  create(data: Prisma.BoardColumnCreateInput) {
    return db.boardColumn.create({ data })
  },

  update(id: number, data: Prisma.BoardColumnUpdateInput) {
    return db.boardColumn.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.boardColumn.delete({ where: { id } })
  },

  updatePositions(updates: { id: number, position: number }[]) {
    return db.$transaction(
      updates.map(({ id, position }) => db.boardColumn.update({ where: { id }, data: { position } }))
    )
  }
}

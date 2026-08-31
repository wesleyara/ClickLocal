import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const subtaskRepository = {
  findById(id: number) {
    return db.subtask.findUnique({ where: { id } })
  },

  findLastByPosition(cardId: number) {
    return db.subtask.findFirst({
      where: { cardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
  },

  create(data: Prisma.SubtaskCreateInput, client: DbClient = db) {
    return client.subtask.create({ data })
  },

  update(id: number, data: Prisma.SubtaskUpdateInput, client: DbClient = db) {
    return client.subtask.update({ where: { id }, data })
  },

  delete(id: number, client: DbClient = db) {
    return client.subtask.delete({ where: { id } })
  },

  updatePositions(updates: { id: number, position: number }[]) {
    return db.$transaction(
      updates.map(({ id, position }) => db.subtask.update({ where: { id }, data: { position } }))
    )
  }
}

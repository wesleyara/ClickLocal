import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const cardRepository = {
  findById(id: number) {
    return db.card.findUnique({ where: { id } })
  },

  findByIdWithRelations(id: number) {
    return db.card.findUnique({
      where: { id },
      include: {
        comments: { orderBy: { createdAt: 'asc' } },
        subtasks: { orderBy: { position: 'asc' } },
        tags: { include: { tag: true } },
        timeEntries: { orderBy: { startedAt: 'desc' } },
        parent: { select: { id: true, title: true } },
        ado: true,
        children: {
          where: { archived: false },
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            archived: true,
            tags: { include: { tag: true } },
            subtasks: { select: { completed: true } },
            _count: { select: { children: { where: { archived: false } } } }
          }
        }
      }
    })
  },

  findManyByIds(ids: number[]) {
    return db.card.findMany({ where: { id: { in: ids } }, select: { id: true, columnId: true, position: true } })
  },

  findLastByPosition(columnId: number) {
    return db.card.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })
  },

  create(data: Prisma.CardCreateInput, client: DbClient = db) {
    return client.card.create({ data })
  },

  update(id: number, data: Prisma.CardUpdateInput, client: DbClient = db) {
    return client.card.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.card.delete({ where: { id } })
  },

  updatePositions(updates: { id: number, columnId: number, position: number }[], client: DbClient = db) {
    return Promise.all(
      updates.map(({ id, columnId, position }) =>
        client.card.update({ where: { id }, data: { columnId, position } })
      )
    )
  }
}

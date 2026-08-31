import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const timeEntryRepository = {
  findByCardId(cardId: number) {
    return db.timeEntry.findMany({ where: { cardId }, orderBy: { startedAt: 'desc' } })
  },

  findById(id: number) {
    return db.timeEntry.findUnique({ where: { id } })
  },

  create(data: Prisma.TimeEntryCreateInput, client: DbClient = db) {
    return client.timeEntry.create({ data })
  },

  update(id: number, data: Prisma.TimeEntryUpdateInput, client: DbClient = db) {
    return client.timeEntry.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.timeEntry.delete({ where: { id } })
  }
}

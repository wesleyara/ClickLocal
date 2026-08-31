import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const tagRepository = {
  findById(id: number) {
    return db.tag.findUnique({ where: { id } })
  },

  findByBoardId(boardId: number) {
    return db.tag.findMany({ where: { boardId }, orderBy: { name: 'asc' } })
  },

  create(data: Prisma.TagCreateInput) {
    return db.tag.create({ data })
  },

  update(id: number, data: Prisma.TagUpdateInput) {
    return db.tag.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.tag.delete({ where: { id } })
  },

  attachToCard(cardId: number, tagId: number, client: DbClient = db) {
    return client.cardTag.upsert({
      where: { cardId_tagId: { cardId, tagId } },
      create: { cardId, tagId },
      update: {}
    })
  },

  detachFromCard(cardId: number, tagId: number, client: DbClient = db) {
    return client.cardTag.delete({ where: { cardId_tagId: { cardId, tagId } } })
  }
}

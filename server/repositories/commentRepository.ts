import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const commentRepository = {
  findById(id: number) {
    return db.comment.findUnique({ where: { id } })
  },

  findByCardId(cardId: number) {
    return db.comment.findMany({ where: { cardId }, orderBy: { createdAt: 'asc' } })
  },

  create(data: Prisma.CommentCreateInput, client: DbClient = db) {
    return client.comment.create({ data })
  },

  update(id: number, data: Prisma.CommentUpdateInput) {
    return db.comment.update({ where: { id }, data })
  },

  delete(id: number) {
    return db.comment.delete({ where: { id } })
  }
}

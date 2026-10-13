import type { Prisma } from '@prisma/client'
import { db } from '../utils/db'

const include = {
  columns: { orderBy: { position: 'asc' } },
  tags: { orderBy: { id: 'asc' } }
} satisfies Prisma.BoardTemplateInclude

export const boardTemplateRepository = {
  findMany() {
    return db.boardTemplate.findMany({ orderBy: { createdAt: 'asc' }, include })
  },

  findById(id: number) {
    return db.boardTemplate.findUnique({ where: { id }, include })
  },

  create(data: Prisma.BoardTemplateCreateInput) {
    return db.boardTemplate.create({ data, include })
  },

  delete(id: number) {
    return db.boardTemplate.delete({ where: { id } })
  }
}

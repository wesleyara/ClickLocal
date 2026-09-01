import type { Prisma } from '@prisma/client'
import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const attachmentRepository = {
  findById(id: number) {
    return db.attachment.findUnique({ where: { id } })
  },

  create(data: Prisma.AttachmentCreateInput, client: DbClient = db) {
    return client.attachment.create({ data })
  }
}

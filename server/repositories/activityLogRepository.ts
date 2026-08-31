import type { DbClient } from '../utils/db'
import { db } from '../utils/db'

export const activityLogRepository = {
  findByCardId(cardId: number) {
    return db.activityLogEntry.findMany({ where: { cardId }, orderBy: { createdAt: 'desc' } })
  },

  create(cardId: number, eventType: string, payload: unknown, client: DbClient = db) {
    return client.activityLogEntry.create({
      data: {
        eventType,
        payload: payload === undefined ? undefined : JSON.stringify(payload),
        card: { connect: { id: cardId } }
      }
    })
  }
}

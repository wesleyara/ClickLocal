import { activityLogRepository } from '../repositories/activityLogRepository'

export async function listActivity(cardId: number) {
  const entries = await activityLogRepository.findByCardId(cardId)
  return entries.map(entry => ({
    ...entry,
    payload: entry.payload ? JSON.parse(entry.payload) : null
  }))
}

import { listActivity } from '../../../../services/activity'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler((event) => {
  const cardId = requireIdParam(event)
  return listActivity(cardId)
})

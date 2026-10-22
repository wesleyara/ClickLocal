import { listEntries } from '../../../../services/timeEntries'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler((event) => {
  const cardId = requireIdParam(event)
  return listEntries(cardId)
})

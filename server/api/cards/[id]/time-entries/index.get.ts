import { listEntries } from '../../../../services/timeEntries'

export default defineEventHandler((event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  return listEntries(cardId)
})

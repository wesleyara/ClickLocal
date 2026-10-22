import { listAdoDiscussion } from '../../../services/azureDevOps/comments'
import { requireIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
  const cardId = requireIdParam(event)

  try {
    return await listAdoDiscussion(cardId)
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

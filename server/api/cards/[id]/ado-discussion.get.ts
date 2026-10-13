import { listAdoDiscussion } from '../../../services/azureDevOps/comments'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))

  try {
    return await listAdoDiscussion(cardId)
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

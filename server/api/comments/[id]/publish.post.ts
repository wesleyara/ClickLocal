import { AlreadyPublishedError, publishComment } from '../../../services/azureDevOps/comments'
import { requireIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    return await publishComment(id)
  } catch (error) {
    if (error instanceof AlreadyPublishedError) {
      throw createError({ statusCode: 409, statusMessage: error.message })
    }
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

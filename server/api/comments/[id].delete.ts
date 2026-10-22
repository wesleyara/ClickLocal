import { deleteComment } from '../../services/comments'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    await deleteComment(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }

  return { success: true }
})

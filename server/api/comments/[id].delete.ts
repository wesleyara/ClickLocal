import { deleteComment } from '../../services/comments'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteComment(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }

  return { success: true }
})

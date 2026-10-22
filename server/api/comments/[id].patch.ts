import { updateComment } from '../../services/comments'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody<{ body?: string }>(event)

  if (!body?.body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'body is required' })
  }

  try {
    return await updateComment(id, { body: body.body })
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Comment not found' })
  }
})

import { deleteTag } from '../../services/tags'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    await deleteTag(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  return { success: true }
})

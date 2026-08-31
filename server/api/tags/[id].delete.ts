import { deleteTag } from '../../services/tags'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteTag(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  return { success: true }
})

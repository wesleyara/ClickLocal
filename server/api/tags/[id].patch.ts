import { updateTag } from '../../services/tags'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody<{ name?: string, color?: string }>(event)

  try {
    return await updateTag(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }
})

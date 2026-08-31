import { updateTag } from '../../services/tags'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ name?: string, color?: string }>(event)

  try {
    return await updateTag(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }
})

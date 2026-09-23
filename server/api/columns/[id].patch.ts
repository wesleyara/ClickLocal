import { updateColumn } from '../../services/columns'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ name?: string, color?: string, adoStateCategory?: string | null }>(event)

  try {
    return await updateColumn(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Column not found' })
  }
})

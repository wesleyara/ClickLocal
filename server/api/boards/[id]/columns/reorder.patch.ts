import { reorderColumns } from '../../../../services/columns'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id: number, position: number }[]>(event)

  if (!Array.isArray(body) || body.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'expected a non-empty array of {id, position}' })
  }

  await reorderColumns(body)
  return { success: true }
})

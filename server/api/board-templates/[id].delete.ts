import { deleteTemplate } from '../../services/boardTemplates'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id') ?? ''
  const result = await deleteTemplate(id)

  if (result === 'builtin') {
    throw createError({ statusCode: 400, statusMessage: 'Built-in templates cannot be deleted' })
  }
  if (result === 'not_found') {
    throw createError({ statusCode: 404, statusMessage: 'Template not found' })
  }

  return { success: true }
})

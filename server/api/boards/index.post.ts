import { createBoard, TemplateNotFoundError } from '../../services/boards'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string, description?: string, templateId?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  try {
    return await createBoard({ name: body.name, description: body.description, templateId: body.templateId })
  } catch (error) {
    if (error instanceof TemplateNotFoundError) {
      throw createError({ statusCode: 404, statusMessage: 'template not found' })
    }
    throw error
  }
})

import { deleteOrphanAttachments } from '../../services/orphanAttachments'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ ids?: unknown }>(event)
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is number => Number.isInteger(id)) : []
  if (!ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'Nenhum anexo selecionado' })
  }
  return deleteOrphanAttachments(ids)
})

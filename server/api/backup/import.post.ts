import { restoreBackup } from '../../services/backup'
import { BackupError, MAX_RESTORE_BYTES } from '../../utils/backup'

// The body is the raw .zip (not multipart) and is streamed straight to disk, never buffered in memory.
export default defineEventHandler(async (event) => {
  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (contentLength > MAX_RESTORE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'O arquivo excede o limite de tamanho aceito' })
  }

  try {
    return await restoreBackup(event.node.req)
  } catch (error) {
    if (error instanceof BackupError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw createError({ statusCode: 500, statusMessage: `Falha ao restaurar: ${(error as Error).message}` })
  }
})

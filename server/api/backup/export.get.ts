import { createReadStream } from 'node:fs'
import { rm, stat } from 'node:fs/promises'
import { createBackupFile } from '../../services/backup'

export default defineEventHandler(async (event) => {
  const { dir, zipPath, fileName } = await createBackupFile().catch((error: Error) => {
    throw createError({ statusCode: 500, statusMessage: `Falha ao gerar o backup: ${error.message}` })
  })

  const { size } = await stat(zipPath)
  setHeader(event, 'Content-Type', 'application/zip')
  setHeader(event, 'Content-Length', size)
  setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`)
  setHeader(event, 'Cache-Control', 'no-store')

  const stream = createReadStream(zipPath)
  stream.on('close', () => rm(dir, { recursive: true, force: true }).catch(() => {}))
  return sendStream(event, stream)
})

import type { AdoWriteMode } from '../../../services/azureDevOps/connection'
import { updateWriteSettings } from '../../../services/azureDevOps/connection'

const VALID_MODES: AdoWriteMode[] = ['readonly', 'dry-run', 'write']

export default defineEventHandler(async (event) => {
  const body = await readBody<{ writeMode?: AdoWriteMode, writeAllowedProjects?: string[] }>(event)

  if (body?.writeMode !== undefined && !VALID_MODES.includes(body.writeMode)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid writeMode' })
  }

  return updateWriteSettings(body ?? {})
})

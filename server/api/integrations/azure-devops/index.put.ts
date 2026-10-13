import { saveConnection } from '../../../services/azureDevOps/connection'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ orgUrl?: string, pat?: string }>(event)

  if (!body?.orgUrl?.trim() || !body?.pat?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'orgUrl and pat are required' })
  }

  try {
    return await saveConnection({ orgUrl: body.orgUrl, pat: body.pat })
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

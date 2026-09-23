import { syncNow } from '../../../services/azureDevOps/sync'

export default defineEventHandler(async () => {
  try {
    return await syncNow()
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

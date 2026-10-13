import { listPendingHours } from '../../../services/azureDevOps/hours'

export default defineEventHandler(async () => {
  try {
    return await listPendingHours()
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

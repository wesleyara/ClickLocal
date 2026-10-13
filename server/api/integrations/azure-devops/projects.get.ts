import { listOrgProjects } from '../../../services/azureDevOps/connection'

export default defineEventHandler(async () => {
  try {
    return await listOrgProjects()
  } catch (error) {
    throw createError({ statusCode: 400, statusMessage: (error as Error).message })
  }
})

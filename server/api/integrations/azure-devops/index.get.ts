import { getConnection } from '../../../services/azureDevOps/connection'

export default defineEventHandler(() => getConnection())

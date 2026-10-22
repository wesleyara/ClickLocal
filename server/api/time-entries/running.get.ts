import { getRunningTimer } from '../../services/timeEntries'

export default defineEventHandler(() => getRunningTimer())

import { getSettings } from '../../services/settings'

export default defineEventHandler(() => getSettings())

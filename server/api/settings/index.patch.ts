import { updateSettings } from '../../services/settings'
import { SettingsError } from '../../utils/settings'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    return await updateSettings(body)
  } catch (error) {
    if (error instanceof SettingsError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }
    throw error
  }
})

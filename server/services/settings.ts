import { appSettingRepository } from '../repositories/appSettingRepository'
import type { AppSettings } from '../utils/settings'
import { decodeSettings, validateSettingsPatch } from '../utils/settings'

export async function getSettings(): Promise<AppSettings> {
  return decodeSettings(await appSettingRepository.findAll())
}

export async function updateSettings(body: unknown): Promise<AppSettings> {
  const patch = validateSettingsPatch(body)
  await appSettingRepository.upsertMany(
    Object.entries(patch).map(([key, value]) => ({ key, value: JSON.stringify(value) }))
  )
  return getSettings()
}

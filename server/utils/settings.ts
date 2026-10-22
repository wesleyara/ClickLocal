/** A known setting: its default and a validator that returns the normalized value or null when invalid. */
interface SettingDefinition<T> {
  default: T
  parse: (value: unknown) => T | null
}

function numberInRange(min: number, max: number) {
  return (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : null)
}

export const SETTING_DEFINITIONS = {
  /** Hours of tracked time per day to aim for. 0 disables the goal. */
  dailyGoalHours: { default: 8, parse: numberInRange(0, 24) } satisfies SettingDefinition<number>,
  /** A running timer older than this many hours is considered forgotten. 0 disables the alert. */
  forgottenTimerHours: { default: 4, parse: numberInRange(0, 24) } satisfies SettingDefinition<number>
}

export type SettingKey = keyof typeof SETTING_DEFINITIONS
export type AppSettings = { [K in SettingKey]: (typeof SETTING_DEFINITIONS)[K]['default'] }

/** Raised for an unknown key or an invalid value — the endpoint turns it into a 400. */
export class SettingsError extends Error {}

function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(SETTING_DEFINITIONS, key)
}

export function defaultSettings(): AppSettings {
  return Object.fromEntries(
    Object.entries(SETTING_DEFINITIONS).map(([key, def]) => [key, def.default])
  ) as AppSettings
}

/** Merges stored rows over the defaults. Unknown keys and values that no longer validate fall back silently. */
export function decodeSettings(rows: { key: string, value: string }[]): AppSettings {
  const settings: Record<string, unknown> = defaultSettings()
  for (const { key, value } of rows) {
    if (!isSettingKey(key)) continue
    let decoded: unknown
    try {
      decoded = JSON.parse(value)
    } catch {
      continue
    }
    const parsed = SETTING_DEFINITIONS[key].parse(decoded)
    if (parsed !== null) settings[key] = parsed
  }
  return settings as AppSettings
}

/** Validates a PATCH body: every key must be known and every value valid, otherwise nothing is applied. */
export function validateSettingsPatch(body: unknown): Partial<AppSettings> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new SettingsError('corpo deve ser um objeto { chave: valor }')
  }

  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (!isSettingKey(key)) throw new SettingsError(`configuração desconhecida: ${key}`)
    const parsed = SETTING_DEFINITIONS[key].parse(value)
    if (parsed === null) throw new SettingsError(`valor inválido para ${key}`)
    patch[key] = parsed
  }
  return patch as Partial<AppSettings>
}

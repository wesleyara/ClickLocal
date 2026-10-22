import { describe, expect, it } from 'vitest'
import { SettingsError, decodeSettings, defaultSettings, validateSettingsPatch } from './settings'

describe('decodeSettings', () => {
  it('returns defaults without rows', () => {
    expect(decodeSettings([])).toEqual(defaultSettings())
  })

  it('applies stored values over defaults', () => {
    expect(decodeSettings([{ key: 'dailyGoalHours', value: '6.5' }]).dailyGoalHours).toBe(6.5)
  })

  it('ignores unknown keys, bad JSON and values that no longer validate', () => {
    const settings = decodeSettings([
      { key: 'legacy', value: '1' },
      { key: 'dailyGoalHours', value: '{oops' },
      { key: 'forgottenTimerHours', value: '99' }
    ])
    expect(settings).toEqual(defaultSettings())
    expect(settings).not.toHaveProperty('legacy')
  })
})

describe('validateSettingsPatch', () => {
  it('accepts known keys with valid values', () => {
    expect(validateSettingsPatch({ dailyGoalHours: 7, forgottenTimerHours: 0 })).toEqual({ dailyGoalHours: 7, forgottenTimerHours: 0 })
  })

  it('accepts an empty patch', () => {
    expect(validateSettingsPatch({})).toEqual({})
  })

  it('rejects non-object bodies', () => {
    for (const body of [null, undefined, 'x', 3, [1]]) {
      expect(() => validateSettingsPatch(body)).toThrow(SettingsError)
    }
  })

  it('rejects unknown keys, including prototype keys', () => {
    expect(() => validateSettingsPatch({ nope: 1 })).toThrow(/desconhecida: nope/)
    expect(() => validateSettingsPatch(JSON.parse('{"__proto__": 1}'))).toThrow(SettingsError)
    expect(() => validateSettingsPatch({ toString: 1 })).toThrow(SettingsError)
  })

  it('rejects invalid values', () => {
    for (const value of [-1, 25, '8', Number.NaN, null, true]) {
      expect(() => validateSettingsPatch({ dailyGoalHours: value })).toThrow(/inválido/)
    }
  })
})

import { db } from '../utils/db'

export const appSettingRepository = {
  findAll() {
    return db.appSetting.findMany()
  },

  upsertMany(entries: { key: string, value: string }[]) {
    return db.$transaction(
      entries.map(({ key, value }) => db.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value }
      }))
    )
  }
}

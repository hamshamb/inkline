import type { InklineDB } from '../db/schema'
import { getDb } from '../db/schema'
import { appSettingsSchema, DEFAULT_SETTINGS, SETTINGS_KEY, type AppSettings } from './settingsSchema'

export class SettingsService {
  constructor(private readonly db: InklineDB = getDb()) {}

  async load(): Promise<AppSettings> {
    const row = await this.db.settings.get(SETTINGS_KEY)
    if (!row) return DEFAULT_SETTINGS
    const parsed = appSettingsSchema.safeParse(row.value)
    return parsed.success ? parsed.data : DEFAULT_SETTINGS
  }

  async save(settings: AppSettings): Promise<AppSettings> {
    const result = appSettingsSchema.safeParse(settings)
    if (!result.success) {
      throw new Error('Invalid settings payload, refusing to persist')
    }
    await this.db.settings.put({ key: SETTINGS_KEY, value: result.data })
    return result.data
  }

  async reset(): Promise<AppSettings> {
    await this.db.settings.delete(SETTINGS_KEY)
    return DEFAULT_SETTINGS
  }
}

export const settingsService = new SettingsService()

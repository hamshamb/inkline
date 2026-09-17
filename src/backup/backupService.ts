import type { InklineDB } from '../db/schema'
import { getDb } from '../db/schema'
import { product } from '../config/product'
import { backupSchema, BACKUP_FORMAT_VERSION, type Backup } from './backupSchema'
import { appSettingsSchema } from '../settings/settingsSchema'
import { SETTINGS_KEY } from '../settings/settingsSchema'

export type { Backup } from './backupSchema'

export type RestoreStrategy = 'merge' | 'replace'

export interface RestoreSummary {
  documentsAdded: number
  documentsUpdated: number
  documentsSkipped: number
  versionsAdded: number
}

export class InvalidBackupError extends Error {
  constructor(message: string, public readonly issues: unknown) {
    super(message)
    this.name = 'InvalidBackupError'
  }
}

export class BackupService {
  constructor(private readonly db: InklineDB = getDb()) {}

  async createBackup(): Promise<Backup> {
    const [documents, versions, settingsRow] = await Promise.all([
      this.db.documents.toArray(),
      this.db.versions.toArray(),
      this.db.settings.get(SETTINGS_KEY),
    ])
    const settingsParsed = settingsRow ? appSettingsSchema.partial().safeParse(settingsRow.value) : undefined

    return {
      format: product.backupFormatId,
      version: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      documents,
      versions,
      settings: settingsParsed?.success ? settingsParsed.data : undefined,
    }
  }

  /** Validates raw parsed JSON as a backup. Throws InvalidBackupError with details on failure — never writes anything. */
  validate(raw: unknown): Backup {
    const result = backupSchema.safeParse(raw)
    if (!result.success) {
      throw new InvalidBackupError('This file is not a valid Inkline backup.', result.error.issues)
    }
    return result.data
  }

  async restore(backup: Backup, strategy: RestoreStrategy): Promise<RestoreSummary> {
    if (strategy === 'replace') return this.restoreReplace(backup)
    return this.restoreMerge(backup)
  }

  private async restoreReplace(backup: Backup): Promise<RestoreSummary> {
    return this.db.transaction('rw', this.db.documents, this.db.versions, this.db.settings, async () => {
      await this.db.documents.clear()
      await this.db.versions.clear()
      await this.db.documents.bulkAdd(backup.documents)
      await this.db.versions.bulkAdd(backup.versions)
      if (backup.settings) {
        await this.db.settings.put({ key: SETTINGS_KEY, value: backup.settings })
      }
      return {
        documentsAdded: backup.documents.length,
        documentsUpdated: 0,
        documentsSkipped: 0,
        versionsAdded: backup.versions.length,
      }
    })
  }

  private async restoreMerge(backup: Backup): Promise<RestoreSummary> {
    return this.db.transaction('rw', this.db.documents, this.db.versions, async () => {
      let added = 0
      let updated = 0
      let skipped = 0

      for (const doc of backup.documents) {
        const existing = await this.db.documents.get(doc.id)
        if (!existing) {
          await this.db.documents.add(doc)
          added++
        } else if (doc.updatedAt > existing.updatedAt) {
          await this.db.documents.put(doc)
          updated++
        } else {
          skipped++
        }
      }

      let versionsAdded = 0
      for (const version of backup.versions) {
        const existing = await this.db.versions.get(version.id)
        if (!existing) {
          await this.db.versions.add(version)
          versionsAdded++
        }
      }

      return { documentsAdded: added, documentsUpdated: updated, documentsSkipped: skipped, versionsAdded }
    })
  }
}

export const backupService = new BackupService()

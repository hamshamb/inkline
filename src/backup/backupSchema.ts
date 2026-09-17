import { z } from 'zod'
import { product } from '../config/product'
import { documentRecordSchema, versionRecordSchema } from '../documents/validation'
import { appSettingsSchema, type AppSettings } from '../settings/settingsSchema'
import type { DocumentRecord, VersionRecord } from '../types/document'

export const BACKUP_FORMAT_VERSION = 1

export const backupSchema = z.object({
  format: z.literal(product.backupFormatId),
  version: z.literal(BACKUP_FORMAT_VERSION),
  exportedAt: z.string(),
  documents: z.array(documentRecordSchema),
  versions: z.array(versionRecordSchema),
  settings: appSettingsSchema.partial().optional(),
})

/**
 * Declared against the app's canonical record types (not `z.infer` of the
 * schema above) so this is the one type the rest of the app works with —
 * the schema's inferred type is only ever used transiently inside
 * `backupSchema.safeParse(...)`, right at the untrusted-JSON boundary.
 */
export interface Backup {
  format: string
  version: number
  exportedAt: string
  documents: DocumentRecord[]
  versions: VersionRecord[]
  settings?: Partial<AppSettings>
}

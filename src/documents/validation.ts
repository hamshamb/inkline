import { z } from 'zod'
import { DOCUMENT_TYPES } from '../types/document'
import { richDocSchema } from './richSchema'

export const documentTypeSchema = z.enum(DOCUMENT_TYPES)

const contentSchema = z.union([z.string(), richDocSchema])

export const documentRecordSchema = z
  .object({
    id: z.string().min(1),
    title: z.string(),
    type: documentTypeSchema,
    content: contentSchema,
    createdAt: z.number(),
    updatedAt: z.number(),
    lastOpenedAt: z.number(),
    pinned: z.boolean(),
    archived: z.boolean(),
    deletedAt: z.number().nullable(),
    tags: z.array(z.string()),
    titleIsManual: z.boolean(),
  })
  .superRefine((doc, ctx) => {
    // A rich document's content must be structured JSON; markdown/plaintext
    // content must be a plain string. Cross-checking this here (rather than
    // relying on the union alone) gives a much clearer validation error and
    // guards against accidental type/content mismatches from bad data.
    if (doc.type === 'rich' && typeof doc.content === 'string') {
      ctx.addIssue({ code: 'custom', message: 'Rich documents must have structured JSON content, not a string' })
    }
    if (doc.type !== 'rich' && typeof doc.content !== 'string') {
      ctx.addIssue({ code: 'custom', message: `${doc.type} documents must have string content` })
    }
  })

export const versionReasonSchema = z.enum([
  'auto',
  'session-start',
  'before-restore',
  'before-import',
  'before-backup-restore',
  'manual',
])

export const versionRecordSchema = z.object({
  id: z.string().min(1),
  documentId: z.string().min(1),
  content: contentSchema,
  createdAt: z.number(),
  reason: versionReasonSchema,
  wordCount: z.number().int().nonnegative(),
})

export const settingRecordSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
})

export type DocumentRecordInput = z.infer<typeof documentRecordSchema>
export type VersionRecordInput = z.infer<typeof versionRecordSchema>

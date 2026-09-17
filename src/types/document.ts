/** Stable internal identifiers for the three supported document types. */
export const DOCUMENT_TYPES = ['rich', 'markdown', 'plaintext'] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

/**
 * Minimal structural type for a Tiptap/ProseMirror JSON node. The precise
 * shape (which node/mark types are legal) is enforced by the Zod schema in
 * `src/documents/richSchema.ts` — this type just gives editor code
 * something to work with.
 */
export interface RichMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface RichNode {
  type: string
  attrs?: Record<string, unknown>
  content?: RichNode[]
  marks?: RichMark[]
  text?: string
}

/** Canonical rich-document content: a Tiptap "doc" node. */
export type RichContent = RichNode

export type DocumentContent<T extends DocumentType = DocumentType> = T extends 'rich'
  ? RichContent
  : string

export interface DocumentRecord {
  id: string
  title: string
  type: DocumentType
  content: RichContent | string
  createdAt: number
  updatedAt: number
  lastOpenedAt: number
  pinned: boolean
  archived: boolean
  deletedAt: number | null
  tags: string[]
  /**
   * Once true, autosave will never overwrite `title` by deriving it from
   * content. Set the first time the user renames the document themselves
   * (including via an explicit "Untitled" no-op rename is still a rename).
   */
  titleIsManual: boolean
}

export type VersionReason =
  | 'auto'
  | 'session-start'
  | 'before-restore'
  | 'before-import'
  | 'before-backup-restore'
  | 'manual'

export interface VersionRecord {
  id: string
  documentId: string
  content: RichContent | string
  createdAt: number
  reason: VersionReason
  wordCount: number
}

export interface SettingRecord {
  key: string
  value: unknown
}

/** Empty document content for a freshly created document of a given type. */
export function emptyContentFor(type: DocumentType): RichContent | string {
  if (type === 'rich') {
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
  return ''
}

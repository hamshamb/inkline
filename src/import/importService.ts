import { documentService, DocumentService } from '../services/documentService'
import type { DocumentRecord, DocumentType } from '../types/document'

/** Text files larger than this are rejected with a clear error rather than freezing the UI. */
export const MAX_IMPORT_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface ImportSuccess {
  ok: true
  filename: string
  document: DocumentRecord
}

export interface ImportFailure {
  ok: false
  filename: string
  reason: string
}

export type ImportResult = ImportSuccess | ImportFailure

function typeForFilename(filename: string): DocumentType | undefined {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'markdown'
  if (lower.endsWith('.txt')) return 'plaintext'
  return undefined
}

export class ImportService {
  constructor(private readonly documents: DocumentService = documentService) {}

  async importFile(file: File): Promise<ImportResult> {
    const type = typeForFilename(file.name)
    if (!type) {
      return { ok: false, filename: file.name, reason: 'Unsupported file type. Only .txt and .md files can be imported.' }
    }
    if (file.size > MAX_IMPORT_FILE_SIZE_BYTES) {
      const limitMb = (MAX_IMPORT_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)
      return { ok: false, filename: file.name, reason: `File is too large to import (limit ${limitMb} MB).` }
    }

    let text: string
    try {
      text = await file.text()
    } catch {
      return { ok: false, filename: file.name, reason: 'Could not read this file.' }
    }

    try {
      // Import always creates a new document — an existing document is
      // never silently overwritten.
      const doc = await this.documents.create(type)
      const titleFromFilename = file.name.replace(/\.(md|markdown|txt)$/i, '')
      const saved = await this.documents.saveContent(doc.id, text)
      const renamed = titleFromFilename.trim()
        ? await this.documents.rename(saved.id, titleFromFilename.trim())
        : saved
      return { ok: true, filename: file.name, document: renamed }
    } catch {
      return { ok: false, filename: file.name, reason: 'Import failed while saving the document.' }
    }
  }

  async importFiles(files: Iterable<File>): Promise<ImportResult[]> {
    const results: ImportResult[] = []
    for (const file of files) {
      results.push(await this.importFile(file))
    }
    return results
  }
}

export const importService = new ImportService()

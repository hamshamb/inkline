import { documentService, DocumentService } from '../services/documentService'
import { extractPlainText } from '../documents/textExtract'
import type { DocumentRecord } from '../types/document'

export interface SearchResult {
  document: DocumentRecord
  excerpt: string
  matchedIn: 'title' | 'content' | 'tags'
}

const EXCERPT_RADIUS = 60

function buildExcerpt(text: string, matchIndex: number, matchLength: number): string {
  const start = Math.max(0, matchIndex - EXCERPT_RADIUS)
  const end = Math.min(text.length, matchIndex + matchLength + EXCERPT_RADIUS)
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`
}

export class SearchService {
  constructor(private readonly documents: DocumentService = documentService) {}

  /** Searches title, extracted plain-text content, and tags. Never touches the network. */
  async search(query: string, opts: { includeArchived?: boolean } = {}): Promise<SearchResult[]> {
    const trimmed = query.trim()
    if (trimmed === '') return []
    const needle = trimmed.toLowerCase()

    const active = await this.documents.listActive()
    const pool = opts.includeArchived ? [...active, ...(await this.documents.listArchived())] : active

    const results: SearchResult[] = []
    for (const doc of pool) {
      const titleIndex = doc.title.toLowerCase().indexOf(needle)
      if (titleIndex !== -1) {
        results.push({ document: doc, excerpt: buildExcerpt(doc.title, titleIndex, needle.length), matchedIn: 'title' })
        continue
      }

      const tagMatch = doc.tags.find((t) => t.toLowerCase().includes(needle))
      const plainText = extractPlainText(doc)
      const contentIndex = plainText.toLowerCase().indexOf(needle)

      if (contentIndex !== -1) {
        results.push({ document: doc, excerpt: buildExcerpt(plainText, contentIndex, needle.length), matchedIn: 'content' })
      } else if (tagMatch) {
        results.push({ document: doc, excerpt: `Tag: ${tagMatch}`, matchedIn: 'tags' })
      }
    }

    results.sort((a, b) => b.document.updatedAt - a.document.updatedAt)
    return results
  }
}

export const searchService = new SearchService()

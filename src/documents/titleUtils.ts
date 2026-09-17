import type { DocumentRecord, RichNode } from '../types/document'
import { extractPlainText } from './textExtract'

export const UNTITLED = 'Untitled'
const MAX_DERIVED_TITLE_LENGTH = 80

/** Pulls the first non-empty line of text to use as a derived title. */
function firstMeaningfulLine(text: string): string {
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (line.length > 0) {
      return line.length > MAX_DERIVED_TITLE_LENGTH ? `${line.slice(0, MAX_DERIVED_TITLE_LENGTH)}…` : line
    }
  }
  return ''
}

/**
 * Derives a title from a document's first meaningful line of content.
 * Returns `undefined` when there's nothing meaningful to derive (so callers
 * can fall back to UNTITLED without stomping an existing title).
 */
export function deriveTitle(doc: Pick<DocumentRecord, 'type' | 'content'>): string | undefined {
  const text = extractPlainText(doc)
  const line = firstMeaningfulLine(stripMarkupForTitle(doc.type, text))
  return line === '' ? undefined : line
}

function stripMarkupForTitle(type: DocumentRecord['type'], text: string): string {
  if (type === 'markdown') {
    // Strip common leading markdown syntax so "## Hello" becomes "Hello".
    return text.replace(/^\s*#{1,6}\s+/, '').replace(/^\s*[-*+]\s+/, '')
  }
  return text
}

/**
 * Computes the title a document should have after a content change,
 * respecting a user-set manual title.
 */
export function nextTitleAfterEdit(doc: Pick<DocumentRecord, 'type' | 'content' | 'titleIsManual'>): string | undefined {
  if (doc.titleIsManual) return undefined
  return deriveTitle(doc) ?? UNTITLED
}

/** Best-effort excerpt for search results / rich rendering that touches raw JSON. */
export function firstHeadingOrLine(node: RichNode): string | undefined {
  const text = extractPlainText({ type: 'rich', content: node })
  const line = firstMeaningfulLine(text)
  return line === '' ? undefined : line
}

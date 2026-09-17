import type { DocumentRecord, RichNode } from '../types/document'

/** Recursively walks a rich-document node tree and collects plain text. */
export function richContentToPlainText(node: RichNode): string {
  const parts: string[] = []

  function walk(n: RichNode) {
    if (n.type === 'text' && n.text) {
      parts.push(n.text)
      return
    }
    if (n.content) {
      for (const child of n.content) walk(child)
    }
    // Block-level nodes get a separating newline so words from adjacent
    // blocks don't run together in extracted text.
    if (n.type === 'paragraph' || n.type === 'heading' || n.type === 'listItem' || n.type === 'blockquote' || n.type === 'codeBlock') {
      parts.push('\n')
    }
  }

  walk(node)
  // Block separators are inserted unconditionally while walking (including
  // after empty/nested blocks), so normalize away the resulting run-on or
  // trailing newlines rather than trying to special-case every nesting
  // shape above. An entirely empty document collapses to '' this way,
  // instead of a stray "\n" being counted as one character.
  return parts.join('').replace(/\n{2,}/g, '\n').trim()
}

/** Extracts a flat, searchable plain-text string from a document's content, regardless of type. */
export function extractPlainText(doc: Pick<DocumentRecord, 'type' | 'content'>): string {
  if (doc.type === 'rich') {
    return richContentToPlainText(doc.content as RichNode)
  }
  return doc.content as string
}

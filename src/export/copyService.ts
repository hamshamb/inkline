import type { DocumentRecord, RichContent } from '../types/document'
import { extractPlainText } from '../documents/textExtract'
import { richToHtml, richToMarkdown } from './richSerializer'

export type CopyFormat = 'text' | 'markdown' | 'html'

export function contentForCopy(doc: DocumentRecord, format: CopyFormat): string {
  if (format === 'text') return extractPlainText(doc)
  if (doc.type === 'rich') {
    const content = doc.content as RichContent
    return format === 'markdown' ? richToMarkdown(content) : richToHtml(content)
  }
  // markdown/plaintext documents: "markdown" and "html" both fall back to
  // their natural representation since there's no separate rich structure.
  return doc.content as string
}

export class ClipboardUnavailableError extends Error {
  constructor() {
    super('Clipboard access was denied or is unavailable in this browser.')
    this.name = 'ClipboardUnavailableError'
  }
}

export async function copyToClipboard(doc: DocumentRecord, format: CopyFormat): Promise<void> {
  const text = contentForCopy(doc, format)
  if (!navigator.clipboard) throw new ClipboardUnavailableError()
  try {
    if (format === 'html' && doc.type === 'rich' && 'write' in navigator.clipboard) {
      const plain = extractPlainText(doc)
      const item = new ClipboardItem({
        'text/html': new Blob([text], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })
      await navigator.clipboard.write([item])
      return
    }
    await navigator.clipboard.writeText(text)
  } catch {
    throw new ClipboardUnavailableError()
  }
}

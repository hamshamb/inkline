import type { DocumentRecord, RichContent } from '../types/document'
import { extractPlainText } from '../documents/textExtract'
import { richToHtml, richToMarkdown } from './richSerializer'
import { renderMarkdownToSafeHtml } from '../editors/markdown/render'
import { wrapAsHtmlDocument } from './htmlDocument'
import { downloadTextFile, slugifyFilename } from './download'

export type ExportFormat = 'txt' | 'md' | 'html'

const MIME_TYPES: Record<ExportFormat, string> = {
  txt: 'text/plain;charset=utf-8',
  md: 'text/markdown;charset=utf-8',
  html: 'text/html;charset=utf-8',
}

/** Which export formats are offered for a given document type. */
export function availableFormats(type: DocumentRecord['type']): ExportFormat[] {
  if (type === 'plaintext') return ['txt']
  if (type === 'markdown') return ['md', 'txt', 'html']
  return ['txt', 'md', 'html']
}

/** Produces the exported text content for a document in a given format. Never touches stored HTML — rich HTML is always generated fresh from trusted structured content. */
export function renderExportContent(doc: DocumentRecord, format: ExportFormat): string {
  if (doc.type === 'plaintext') return doc.content as string

  if (doc.type === 'markdown') {
    const source = doc.content as string
    if (format === 'md' || format === 'txt') return source
    return wrapAsHtmlDocument(doc.title, renderMarkdownToSafeHtml(source))
  }

  // rich
  const content = doc.content as RichContent
  if (format === 'txt') return extractPlainText(doc)
  if (format === 'md') return richToMarkdown(content)
  return wrapAsHtmlDocument(doc.title, richToHtml(content))
}

export async function exportDocument(doc: DocumentRecord, format: ExportFormat): Promise<void> {
  const content = renderExportContent(doc, format)
  const filename = `${slugifyFilename(doc.title)}.${format}`
  await downloadTextFile(filename, content, MIME_TYPES[format])
}

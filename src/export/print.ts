import type { DocumentRecord, RichContent } from '../types/document'
import { richToHtml } from './richSerializer'
import { renderMarkdownToSafeHtml } from '../editors/markdown/render'
import { escapeHtml } from '../utils/escapeHtml'

function bodyHtmlFor(doc: DocumentRecord): string {
  if (doc.type === 'plaintext') {
    return `<pre style="white-space: pre-wrap; font-family: inherit;">${escapeHtml(doc.content as string)}</pre>`
  }
  if (doc.type === 'markdown') {
    return renderMarkdownToSafeHtml(doc.content as string)
  }
  return richToHtml(doc.content as RichContent)
}

/** Renders a document into the hidden #print-root and invokes the browser print dialog. Print CSS (index.css) hides everything else. */
export function printDocument(doc: DocumentRecord): void {
  const root = document.getElementById('print-root')
  if (!root) return

  root.innerHTML = `<div style="max-width: 46rem; margin: 0 auto; padding: 2rem; font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; line-height: 1.65;">
    <h1>${escapeHtml(doc.title)}</h1>
    ${bodyHtmlFor(doc)}
  </div>`

  const cleanup = () => {
    root.innerHTML = ''
    window.removeEventListener('afterprint', cleanup)
  }
  window.addEventListener('afterprint', cleanup)

  window.print()
}

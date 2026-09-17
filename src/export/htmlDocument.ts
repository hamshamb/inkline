import { escapeHtml } from '../utils/escapeHtml'

const DOCUMENT_STYLES = `
  body { font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; line-height: 1.65; max-width: 46rem; margin: 2rem auto; padding: 0 1.5rem; color: #1c1c1f; }
  h1, h2, h3 { line-height: 1.3; }
  pre { background: #f4f3f1; padding: 0.75rem 1rem; border-radius: 6px; overflow-x: auto; }
  code { background: #f4f3f1; padding: 0.15em 0.35em; border-radius: 4px; }
  pre code { background: none; padding: 0; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 3px solid #d6d3d1; color: #52525b; }
  a { color: #6841f0; }
  .md-image-placeholder { display: inline-block; padding: 0.15em 0.5em; border-radius: 4px; background: #f4f3f1; color: #6b6d76; font-style: italic; }
  ul[data-type='taskList'] { list-style: none; padding-left: 0.25rem; }
  ul[data-type='taskList'] li { display: flex; gap: 0.5rem; align-items: flex-start; }
`

/** Wraps trusted body HTML (already generated from our own schema or the safe Markdown renderer) into a standalone document for export/print. */
export function wrapAsHtmlDocument(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>${DOCUMENT_STYLES}</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
${bodyHtml}
</body>
</html>
`
}

import { generateHTML } from '@tiptap/html'
import type { RichContent, RichMark, RichNode } from '../types/document'
import { createRichExtensions } from '../editors/rich/extensions'

/** Generates HTML from trusted, schema-validated rich content (never from raw/untrusted HTML strings). */
export function richToHtml(content: RichContent): string {
  return generateHTML(content, createRichExtensions())
}

function wrapMarks(text: string, marks: RichMark[] = []): string {
  let result = text
  const has = (t: string) => marks.some((m) => m.type === t)
  if (has('code')) result = `\`${result}\``
  if (has('italic')) result = `*${result}*`
  if (has('bold')) result = `**${result}**`
  if (has('strike')) result = `~~${result}~~`
  const link = marks.find((m) => m.type === 'link')
  const href = link?.attrs?.href
  if (typeof href === 'string') result = `[${result}](${href})`
  return result
}

function inline(nodes: RichNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === 'text') return wrapMarks(n.text ?? '', n.marks)
      if (n.type === 'hardBreak') return '  \n'
      return ''
    })
    .join('')
}

function indentLines(text: string, indent: string): string {
  return text
    .split('\n')
    .map((line) => (line === '' ? line : indent + line))
    .join('\n')
}

function serializeListItem(item: RichNode, marker: string, childIndent: string): string {
  const children = item.content ?? []
  const [first, ...rest] = children
  const firstLine = first ? serializeBlock(first) : ''
  const restBlock = rest.map((child) => serializeBlock(child)).join('\n\n')
  const restIndented = restBlock ? `\n${indentLines(restBlock, childIndent)}` : ''
  return `${marker} ${firstLine}${restIndented}`
}

function serializeBlock(node: RichNode): string {
  switch (node.type) {
    case 'paragraph':
      return inline(node.content)
    case 'heading': {
      const level = typeof node.attrs?.level === 'number' ? node.attrs.level : 1
      return `${'#'.repeat(level)} ${inline(node.content)}`
    }
    case 'blockquote':
      return indentLines((node.content ?? []).map(serializeBlock).join('\n\n'), '> ').replace(/^> $/gm, '>')
    case 'codeBlock': {
      const language = typeof node.attrs?.language === 'string' ? node.attrs.language : ''
      const text = (node.content ?? []).map((c) => c.text ?? '').join('')
      return `\`\`\`${language}\n${text}\n\`\`\``
    }
    case 'horizontalRule':
      return '---'
    case 'bulletList':
      return (node.content ?? []).map((li) => serializeListItem(li, '-', '  ')).join('\n')
    case 'orderedList': {
      const start = typeof node.attrs?.start === 'number' ? node.attrs.start : 1
      return (node.content ?? []).map((li, i) => serializeListItem(li, `${start + i}.`, '   ')).join('\n')
    }
    case 'taskList':
      return (node.content ?? [])
        .map((li) => serializeListItem(li, `- [${li.attrs?.checked ? 'x' : ' '}]`, '  '))
        .join('\n')
    default:
      return inline(node.content)
  }
}

/**
 * Best-effort Markdown serialization of rich content. Some rich formatting
 * has no standard Markdown equivalent (underline, text color, highlight)
 * and is exported as plain text — this is a one-way export, not a
 * roundtrip conversion.
 */
export function richToMarkdown(doc: RichContent): string {
  const blocks = (doc.content ?? []).map(serializeBlock)
  return `${blocks.join('\n\n').trim()}\n`
}

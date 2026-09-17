import { describe, expect, it } from 'vitest'
import { extractPlainText, richContentToPlainText } from './textExtract'
import type { RichNode } from '../types/document'

function doc(...content: RichNode[]): RichNode {
  return { type: 'doc', content }
}

describe('richContentToPlainText', () => {
  it('extracts text from a simple paragraph', () => {
    const node = doc({ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] })
    expect(richContentToPlainText(node).trim()).toBe('Hello world')
  })

  it('separates block-level nodes with newlines', () => {
    const node = doc(
      { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
    )
    const text = richContentToPlainText(node)
    expect(text).toContain('First')
    expect(text).toContain('Second')
    expect(text.indexOf('First')).toBeLessThan(text.indexOf('Second'))
  })

  it('walks nested lists', () => {
    const node = doc({
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item one' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item two' }] }] },
      ],
    })
    const text = richContentToPlainText(node)
    expect(text).toContain('Item one')
    expect(text).toContain('Item two')
  })

  it('ignores marks and only reads text', () => {
    const node = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'bold text', marks: [{ type: 'bold' }] }],
    })
    expect(richContentToPlainText(node).trim()).toBe('bold text')
  })

  it('handles empty documents', () => {
    expect(richContentToPlainText(doc()).trim()).toBe('')
  })
})

describe('extractPlainText', () => {
  it('extracts from rich content', () => {
    const content = doc({ type: 'paragraph', content: [{ type: 'text', text: 'Rich text' }] })
    expect(extractPlainText({ type: 'rich', content }).trim()).toBe('Rich text')
  })

  it('returns markdown content as-is', () => {
    expect(extractPlainText({ type: 'markdown', content: '# Heading\n\nBody' })).toBe('# Heading\n\nBody')
  })

  it('returns plaintext content as-is', () => {
    expect(extractPlainText({ type: 'plaintext', content: 'plain text here' })).toBe('plain text here')
  })
})

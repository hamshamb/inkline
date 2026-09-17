import { describe, expect, it } from 'vitest'
import { deriveTitle, nextTitleAfterEdit, UNTITLED } from './titleUtils'
import type { RichNode } from '../types/document'

function richDoc(text: string): RichNode {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] }
}

describe('deriveTitle', () => {
  it('uses the first non-empty line of plaintext', () => {
    expect(deriveTitle({ type: 'plaintext', content: 'First line\nSecond line' })).toBe('First line')
  })

  it('skips leading blank lines', () => {
    expect(deriveTitle({ type: 'plaintext', content: '\n\n  \nActual title\nmore' })).toBe('Actual title')
  })

  it('strips markdown heading syntax', () => {
    expect(deriveTitle({ type: 'markdown', content: '## My Heading\nbody' })).toBe('My Heading')
  })

  it('strips markdown list syntax', () => {
    expect(deriveTitle({ type: 'markdown', content: '- first item' })).toBe('first item')
  })

  it('derives from rich content text', () => {
    expect(deriveTitle({ type: 'rich', content: richDoc('Rich title here') })).toBe('Rich title here')
  })

  it('returns undefined for entirely empty content', () => {
    expect(deriveTitle({ type: 'plaintext', content: '   \n  ' })).toBeUndefined()
    expect(deriveTitle({ type: 'rich', content: { type: 'doc', content: [{ type: 'paragraph' }] } })).toBeUndefined()
  })

  it('truncates very long first lines', () => {
    const longLine = 'x'.repeat(200)
    const title = deriveTitle({ type: 'plaintext', content: longLine })
    expect(title?.length).toBeLessThan(200)
    expect(title?.endsWith('…')).toBe(true)
  })
})

describe('nextTitleAfterEdit', () => {
  it('derives a new title when titleIsManual is false', () => {
    const result = nextTitleAfterEdit({ type: 'plaintext', content: 'New content here', titleIsManual: false })
    expect(result).toBe('New content here')
  })

  it('falls back to UNTITLED when content has no meaningful text and title is not manual', () => {
    expect(nextTitleAfterEdit({ type: 'plaintext', content: '', titleIsManual: false })).toBe(UNTITLED)
  })

  it('never overrides a manually-set title', () => {
    expect(nextTitleAfterEdit({ type: 'plaintext', content: 'Something else entirely', titleIsManual: true })).toBeUndefined()
  })
})

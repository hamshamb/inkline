import { describe, expect, it } from 'vitest'
import { documentRecordSchema, versionRecordSchema } from './validation'
import { validateRichContent } from './richSchema'
import type { DocumentRecord } from '../types/document'

function baseDoc(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: 'doc-1',
    title: 'Untitled',
    type: 'plaintext',
    content: 'hello',
    createdAt: 1000,
    updatedAt: 1000,
    lastOpenedAt: 1000,
    pinned: false,
    archived: false,
    deletedAt: null,
    tags: [],
    titleIsManual: false,
    ...overrides,
  }
}

describe('documentRecordSchema', () => {
  it('accepts a valid plaintext document', () => {
    expect(documentRecordSchema.safeParse(baseDoc()).success).toBe(true)
  })

  it('accepts a valid markdown document', () => {
    expect(documentRecordSchema.safeParse(baseDoc({ type: 'markdown', content: '# Title' })).success).toBe(true)
  })

  it('accepts a valid rich document', () => {
    const rich = baseDoc({ type: 'rich', content: { type: 'doc', content: [{ type: 'paragraph' }] } })
    expect(documentRecordSchema.safeParse(rich).success).toBe(true)
  })

  it('rejects a rich document with string content', () => {
    const result = documentRecordSchema.safeParse(baseDoc({ type: 'rich', content: 'not json' }))
    expect(result.success).toBe(false)
  })

  it('rejects a plaintext document with object content', () => {
    const result = documentRecordSchema.safeParse(
      baseDoc({ type: 'plaintext', content: { type: 'doc', content: [] } as unknown as string }),
    )
    expect(result.success).toBe(false)
  })

  it('rejects an unknown document type', () => {
    const result = documentRecordSchema.safeParse(baseDoc({ type: 'unknown' as unknown as 'plaintext' }))
    expect(result.success).toBe(false)
  })

  it('rejects a missing required field', () => {
    const { title: _title, ...rest } = baseDoc()
    expect(documentRecordSchema.safeParse(rest).success).toBe(false)
  })
})

describe('versionRecordSchema', () => {
  it('accepts a valid version record', () => {
    const result = versionRecordSchema.safeParse({
      id: 'v1',
      documentId: 'doc-1',
      content: 'snapshot',
      createdAt: 1000,
      reason: 'auto',
      wordCount: 3,
    })
    expect(result.success).toBe(true)
  })

  it('rejects an invalid reason', () => {
    const result = versionRecordSchema.safeParse({
      id: 'v1',
      documentId: 'doc-1',
      content: 'snapshot',
      createdAt: 1000,
      reason: 'not-a-real-reason',
      wordCount: 3,
    })
    expect(result.success).toBe(false)
  })
})

describe('richSchema (closed schema)', () => {
  it('accepts a doc built from supported node/mark types', () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Title' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
            { type: 'text', text: ' and a ' },
            { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] },
          ],
        },
        { type: 'taskList', content: [{ type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph' }] }] },
        { type: 'horizontalRule' },
      ],
    }
    expect(validateRichContent(content).success).toBe(true)
  })

  it('rejects an unknown node type', () => {
    const content = { type: 'doc', content: [{ type: 'image', attrs: { src: 'x.png' } }] }
    expect(validateRichContent(content).success).toBe(false)
  })

  it('rejects a link with an unsafe scheme', () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'click me', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }],
        },
      ],
    }
    expect(validateRichContent(content).success).toBe(false)
  })

  it('rejects a heading level outside 1-3', () => {
    const content = { type: 'doc', content: [{ type: 'heading', attrs: { level: 4 }, content: [] }] }
    expect(validateRichContent(content).success).toBe(false)
  })
})

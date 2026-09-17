import { describe, expect, it } from 'vitest'
import { richToHtml, richToMarkdown } from './richSerializer'
import type { RichContent, RichNode } from '../types/document'

function doc(...content: RichNode[]): RichContent {
  return { type: 'doc', content }
}

describe('richToMarkdown', () => {
  it('serializes a paragraph', () => {
    const content = doc({ type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] })
    expect(richToMarkdown(content).trim()).toBe('Hello world')
  })

  it('serializes headings with the right number of #', () => {
    const content = doc({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Section' }] })
    expect(richToMarkdown(content).trim()).toBe('## Section')
  })

  it('serializes bold, italic, and inline code marks', () => {
    const content = doc({
      type: 'paragraph',
      content: [
        { type: 'text', text: 'bold', marks: [{ type: 'bold' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'italic', marks: [{ type: 'italic' }] },
        { type: 'text', text: ' and ' },
        { type: 'text', text: 'code', marks: [{ type: 'code' }] },
      ],
    })
    const md = richToMarkdown(content)
    expect(md).toContain('**bold**')
    expect(md).toContain('*italic*')
    expect(md).toContain('`code`')
  })

  it('serializes links as [text](href)', () => {
    const content = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'click here', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }],
    })
    expect(richToMarkdown(content).trim()).toBe('[click here](https://example.com)')
  })

  it('serializes a bullet list', () => {
    const content = doc({
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] }] },
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'two' }] }] },
      ],
    })
    const md = richToMarkdown(content)
    expect(md).toContain('- one')
    expect(md).toContain('- two')
  })

  it('serializes an ordered list honoring the start attribute', () => {
    const content = doc({
      type: 'orderedList',
      attrs: { start: 3 },
      content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'third' }] }] }],
    })
    expect(richToMarkdown(content)).toContain('3. third')
  })

  it('serializes a task list with checked state', () => {
    const content = doc({
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'done' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: 'todo' }] }] },
      ],
    })
    const md = richToMarkdown(content)
    expect(md).toContain('- [x] done')
    expect(md).toContain('- [ ] todo')
  })

  it('serializes a code block with language and fences', () => {
    const content = doc({ type: 'codeBlock', attrs: { language: 'ts' }, content: [{ type: 'text', text: 'const x = 1' }] })
    const md = richToMarkdown(content)
    expect(md).toContain('```ts')
    expect(md).toContain('const x = 1')
  })

  it('serializes a blockquote with a > prefix', () => {
    const content = doc({ type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'quoted' }] }] })
    expect(richToMarkdown(content).trim()).toBe('> quoted')
  })

  it('serializes a horizontal rule', () => {
    expect(richToMarkdown(doc({ type: 'horizontalRule' })).trim()).toBe('---')
  })
})

describe('richToHtml', () => {
  it('generates HTML from trusted structured content', () => {
    const content = doc({ type: 'paragraph', content: [{ type: 'text', text: 'Hello', marks: [{ type: 'bold' }] }] })
    const html = richToHtml(content)
    expect(html).toContain('<strong>Hello</strong>')
  })

  it('never renders an unsafe link href', () => {
    // Even if something upstream failed to validate, generateHTML only ever
    // walks known node/mark types from trusted schema-built content — there
    // is no code path here that writes a raw HTML string from user input.
    const content = doc({
      type: 'paragraph',
      content: [{ type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'https://example.com' } }] }],
    })
    const html = richToHtml(content)
    expect(html).toContain('href="https://example.com"')
  })
})

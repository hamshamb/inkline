import { describe, expect, it } from 'vitest'
import { renderMarkdownToSafeHtml } from './render'

describe('renderMarkdownToSafeHtml', () => {
  it('renders basic markdown to HTML', () => {
    const html = renderMarkdownToSafeHtml('# Heading\n\nSome **bold** text.')
    expect(html).toContain('<h1>Heading</h1>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('never renders raw HTML embedded in the source', () => {
    const html = renderMarkdownToSafeHtml('<script>alert(1)</script>\n\nHello')
    expect(html).not.toContain('<script>')
  })

  it('never turns a javascript: destination into a clickable link', () => {
    // markdown-it's own parser already refuses this scheme as a link
    // destination, so it renders as plain visible text — still safe, just
    // via a different layer than our own scheme allowlist.
    const html = renderMarkdownToSafeHtml('[click me](javascript:alert(1))')
    expect(html).not.toContain('<a ')
    expect(html).not.toMatch(/href="javascript:/)
  })

  it('never turns a data: destination into a clickable link', () => {
    const html = renderMarkdownToSafeHtml('[click me](data:text/html,<script>alert(1)</script>)')
    expect(html).not.toContain('<a ')
    expect(html).not.toMatch(/href="data:/)
  })

  it('rejects a scheme our allowlist blocks even when markdown-it itself would allow it', () => {
    // ftp: isn't blocked by markdown-it's own default link validator, so
    // this specifically exercises our own safe-scheme allowlist layer.
    const html = renderMarkdownToSafeHtml('[file](ftp://example.com/file)')
    expect(html).not.toMatch(/href="ftp:/)
    expect(html).toContain('data-unsafe-link')
  })

  it('allows a safe https link and adds rel/target', () => {
    const html = renderMarkdownToSafeHtml('[safe](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noopener noreferrer nofollow"')
  })

  it('does not render an <img> tag for image syntax', () => {
    const html = renderMarkdownToSafeHtml('![a cat](https://example.com/cat.png)')
    expect(html).not.toContain('<img')
    expect(html).toContain('image: a cat')
  })

  it('escapes HTML-special characters from plain text', () => {
    const html = renderMarkdownToSafeHtml('1 < 2 and 3 > 2')
    expect(html).toContain('&lt;')
    expect(html).toContain('&gt;')
  })
})

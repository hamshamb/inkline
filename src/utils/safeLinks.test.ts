import { describe, expect, it } from 'vitest'
import { isSafeUrl, sanitizeUrl } from './safeLinks'

describe('isSafeUrl', () => {
  it.each(['http://example.com', 'https://example.com/path?q=1', 'mailto:a@b.com', 'tel:+15551234567'])(
    'accepts safe absolute URL %s',
    (url) => {
      expect(isSafeUrl(url)).toBe(true)
    },
  )

  it.each(['#section', '/relative/path', './local', '../up'])('accepts safe relative URL %s', (url) => {
    expect(isSafeUrl(url)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '',
    '   ',
  ])('rejects unsafe URL %s', (url) => {
    expect(isSafeUrl(url)).toBe(false)
  })

  it('rejects a scheme smuggled after whitespace/control characters', () => {
    expect(isSafeUrl('java\tscript:alert(1)')).toBe(false)
  })
})

describe('sanitizeUrl', () => {
  it('returns the url when safe', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
  })

  it('returns undefined when unsafe or missing', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeUrl(null)).toBeUndefined()
    expect(sanitizeUrl(undefined)).toBeUndefined()
  })
})

/**
 * Allowlist of URL schemes that are safe to render as clickable links or
 * pass to the DOM. Everything else (javascript:, data:, vbscript:, file:,
 * etc.) is rejected — both in stored rich-document content and in rendered
 * Markdown previews.
 */
const SAFE_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']

export function isSafeUrl(rawUrl: string): boolean {
  const url = rawUrl.trim()
  if (url === '') return false

  // Relative URLs and same-page anchors are always safe: they cannot smuggle
  // an executable scheme.
  if (url.startsWith('#') || url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true
  }

  try {
    // A base is required to parse protocol-relative/relative URLs, but if
    // the URL is absolute the base is ignored.
    const parsed = new URL(url, 'https://inkline.invalid/')
    return SAFE_SCHEMES.includes(parsed.protocol.toLowerCase())
  } catch {
    return false
  }
}

/** Returns the URL if safe, otherwise `undefined`. */
export function sanitizeUrl(rawUrl: string | null | undefined): string | undefined {
  if (!rawUrl) return undefined
  return isSafeUrl(rawUrl) ? rawUrl : undefined
}

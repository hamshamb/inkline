import MarkdownIt from 'markdown-it'
import type { RendererRule } from 'markdown-it'
import { isSafeUrl } from '../../utils/safeLinks'

/**
 * Safe Markdown -> HTML rendering for the preview pane and print/export.
 *
 * - Raw HTML in Markdown source is disabled entirely (`html: false`), so
 *   there is no way to smuggle a <script> tag or event handler through.
 * - Link/autolink hrefs are re-validated against the same safe-scheme
 *   allowlist used for rich-document links (rejects javascript:, data:,
 *   vbscript:, etc.).
 * - Images are not rendered as <img> tags (v1 has no image support, and
 *   loading a remote image would be an undisclosed network request) —
 *   they're rendered as a plain text placeholder instead.
 */
function createRenderer() {
  const md = new MarkdownIt('commonmark', {
    html: false,
    linkify: true,
    breaks: false,
  }).enable(['table', 'strikethrough'])

  const defaultLinkOpen: RendererRule =
    md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options))

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx]
    const hrefIndex = token?.attrIndex('href') ?? -1
    if (token && hrefIndex >= 0) {
      const href = String(token.attrs?.[hrefIndex]?.[1] ?? '')
      if (!isSafeUrl(href)) {
        token.attrSet('href', '#')
        token.attrSet('data-unsafe-link', 'true')
      } else {
        token.attrSet('target', '_blank')
        token.attrSet('rel', 'noopener noreferrer nofollow')
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  md.renderer.rules.image = (tokens, idx) => {
    const token = tokens[idx]
    const alt = token?.content ?? 'image'
    return `<span class="md-image-placeholder">[image: ${md.utils.escapeHtml(alt)}]</span>`
  }

  return md
}

const renderer = createRenderer()

export function renderMarkdownToSafeHtml(source: string): string {
  return renderer.render(source)
}

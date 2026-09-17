import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/**
 * Uses the same CSS custom properties as the rest of the app (defined in
 * index.css) so the CodeMirror surface stays visually in sync with
 * light/dark theme changes without needing to rebuild the editor.
 */
export const cmBaseTheme = EditorView.theme({
  '&': {
    color: 'var(--color-text)',
    backgroundColor: 'transparent',
    height: '100%',
    fontSize: 'inherit',
  },
  '.cm-content': {
    fontFamily: 'var(--font-mono)',
    caretColor: 'var(--color-accent)',
    padding: '0',
  },
  '.cm-scroller': {
    fontFamily: 'var(--font-mono)',
    lineHeight: 'inherit',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--color-accent)',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--color-text) 5%, transparent)',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--color-muted)',
    border: 'none',
  },
  '.cm-matchingBracket, .cm-nonmatchingBracket': {
    backgroundColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
    outline: 'none',
  },
  '.cm-searchMatch': {
    backgroundColor: 'color-mix(in srgb, var(--color-warning) 35%, transparent)',
    borderRadius: '2px',
  },
  '.cm-searchMatch-selected': {
    backgroundColor: 'color-mix(in srgb, var(--color-warning) 60%, transparent)',
  },
  '.cm-panels': {
    backgroundColor: 'var(--color-elevated)',
    color: 'var(--color-text)',
  },
  '.cm-panel input, .cm-panel button': {
    color: 'var(--color-text)',
  },
  '.cm-panel.cm-search': {
    padding: '6px 8px',
    borderTop: '1px solid var(--color-border)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--color-elevated)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  },
  '.cm-placeholder': {
    color: 'var(--color-muted)',
  },
})

const highlightStyle = HighlightStyle.define([
  { tag: t.heading1, fontWeight: '700', fontSize: '1.5em' },
  { tag: t.heading2, fontWeight: '700', fontSize: '1.3em' },
  { tag: t.heading3, fontWeight: '600', fontSize: '1.15em' },
  { tag: [t.heading4, t.heading5, t.heading6], fontWeight: '600' },
  { tag: t.strong, fontWeight: '700' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.strikethrough, textDecoration: 'line-through' },
  { tag: t.link, color: 'var(--color-accent)', textDecoration: 'underline' },
  { tag: t.url, color: 'var(--color-accent)' },
  { tag: [t.monospace, t.string], color: 'var(--color-success)' },
  { tag: t.quote, color: 'var(--color-muted)', fontStyle: 'italic' },
  { tag: t.keyword, color: 'var(--color-accent)' },
  { tag: t.comment, color: 'var(--color-muted)', fontStyle: 'italic' },
  { tag: t.meta, color: 'var(--color-muted)' },
  { tag: t.atom, color: 'var(--color-warning)' },
  { tag: t.processingInstruction, color: 'var(--color-muted)' },
])

export const cmSyntaxHighlighting = syntaxHighlighting(highlightStyle)

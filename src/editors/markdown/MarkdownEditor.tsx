import { useMemo, useRef, useState } from 'react'
import { markdown } from '@codemirror/lang-markdown'
import { placeholder as cmPlaceholder } from '@codemirror/view'
import { Code2, Columns2, Eye } from 'lucide-react'
import { createBaseExtensions } from '../shared/cmBaseExtensions'
import { useCodeMirror } from '../../hooks/useCodeMirror'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { renderMarkdownToSafeHtml } from './render'
import type { AppSettings } from '../../settings/settingsSchema'

export type MarkdownViewMode = 'source' | 'split' | 'preview'

export interface MarkdownEditorProps {
  initialContent: string
  settings: AppSettings
  autoFocus: boolean
  onChange: (text: string) => void
  onCursorUpdate?: (info: { line: number; column: number }) => void
}

function ModeButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof Code2
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label}
      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
        active ? 'bg-[var(--color-active)] text-[var(--color-text)]' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
      }`}
    >
      <Icon size={13} aria-hidden />
      {label}
    </button>
  )
}

export function MarkdownEditor({ initialContent, settings, autoFocus, onChange, onCursorUpdate }: MarkdownEditorProps) {
  const isNarrow = useMediaQuery('(max-width: 767px)')
  const [mode, setMode] = useState<MarkdownViewMode>('source')
  const effectiveMode = isNarrow && mode === 'split' ? 'source' : mode

  const [sourceForPreview, setSourceForPreview] = useState(initialContent)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onCursorRef = useRef(onCursorUpdate)
  onCursorRef.current = onCursorUpdate

  const extensions = useMemo(
    () => [
      ...createBaseExtensions({
        lineWrapping: settings.wordWrap,
        lineNumbers: settings.lineNumbers,
        spellcheck: settings.spellcheck,
        onChange: (v) => {
          onChangeRef.current(v)
          setSourceForPreview(v)
        },
        onCursorUpdate: (info) => onCursorRef.current?.(info),
      }),
      markdown(),
      cmPlaceholder('Start writing in Markdown…'),
    ],
    [settings.wordWrap, settings.lineNumbers, settings.spellcheck],
  )

  const { containerRef } = useCodeMirror({ doc: initialContent, extensions, autoFocus })

  const previewHtml = useMemo(() => renderMarkdownToSafeHtml(sourceForPreview), [sourceForPreview])
  const showSource = effectiveMode === 'source' || effectiveMode === 'split'
  const showPreview = effectiveMode === 'preview' || effectiveMode === 'split'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-chrome)] px-2 py-1.5">
        <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] p-0.5">
          <ModeButton icon={Code2} label="Source" active={effectiveMode === 'source'} onClick={() => setMode('source')} />
          {!isNarrow && <ModeButton icon={Columns2} label="Split" active={effectiveMode === 'split'} onClick={() => setMode('split')} />}
          <ModeButton icon={Eye} label="Preview" active={effectiveMode === 'preview'} onClick={() => setMode('preview')} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        {/* The source pane stays mounted across mode switches (hidden via
            CSS, not unmounted) — CodeMirror's EditorView is attached to
            this specific DOM node once and is never re-parented, so
            unmounting it here would silently orphan the editor. */}
        <div
          className={`min-h-0 overflow-y-auto px-6 py-8 sm:px-10 ${showSource ? '' : 'hidden'} ${
            showPreview ? 'w-1/2 border-r border-[var(--color-border)]' : 'w-full'
          }`}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
        >
          <div ref={containerRef} className="mx-auto h-full max-w-3xl" />
        </div>
        {showPreview && (
          <div
            className={`min-h-0 overflow-y-auto px-6 py-8 sm:px-10 ${showSource ? 'w-1/2' : 'w-full'}`}
            style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
          >
            <div
              className="inkline-rich-prose mx-auto max-w-3xl"
              // Safe: renderMarkdownToSafeHtml disables raw HTML and validates every link/image.
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

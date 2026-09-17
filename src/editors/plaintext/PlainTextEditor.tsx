import { useMemo, useRef } from 'react'
import { placeholder as cmPlaceholder } from '@codemirror/view'
import { createBaseExtensions } from '../shared/cmBaseExtensions'
import { useCodeMirror } from '../../hooks/useCodeMirror'
import type { AppSettings } from '../../settings/settingsSchema'

export interface PlainTextEditorProps {
  initialContent: string
  settings: AppSettings
  autoFocus: boolean
  onChange: (text: string) => void
  onCursorUpdate?: (info: { line: number; column: number }) => void
}

export function PlainTextEditor({ initialContent, settings, autoFocus, onChange, onCursorUpdate }: PlainTextEditorProps) {
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
        onChange: (v) => onChangeRef.current(v),
        onCursorUpdate: (info) => onCursorRef.current?.(info),
      }),
      cmPlaceholder('Start writing…'),
    ],
    [settings.wordWrap, settings.lineNumbers, settings.spellcheck],
  )

  const { containerRef } = useCodeMirror({ doc: initialContent, extensions, autoFocus })

  return (
    <div
      className="h-full min-h-0 overflow-y-auto px-6 py-8 sm:px-10"
      style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
    >
      <div ref={containerRef} className="mx-auto h-full max-w-3xl" />
    </div>
  )
}

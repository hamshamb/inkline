import { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { DocumentRecord, RichContent } from '../types/document'
import type { AppSettings } from '../settings/settingsSchema'
import { AutosaveController, type SaveStatus } from '../services/autosaveService'
import { versionService } from '../services/versionService'
import { extractPlainText } from '../documents/textExtract'
import { computeTextStats, type TextStats } from '../utils/wordCount'
import { debounce } from '../utils/debounce'

// Each editor pulls in a heavy library (Tiptap/ProseMirror or CodeMirror).
// Loading only the one the open document actually needs keeps the initial
// bundle small — most sessions only ever touch one or two document types.
const RichEditor = lazy(() => import('./rich/RichEditor').then((m) => ({ default: m.RichEditor })))
const MarkdownEditor = lazy(() => import('./markdown/MarkdownEditor').then((m) => ({ default: m.MarkdownEditor })))
const PlainTextEditor = lazy(() => import('./plaintext/PlainTextEditor').then((m) => ({ default: m.PlainTextEditor })))

function EditorLoadingFallback() {
  return <div className="h-full w-full" aria-hidden />
}

export interface EditorHostHandle {
  flush: () => Promise<void>
}

export interface CursorInfo {
  line: number
  column: number
}

export interface EditorHostProps {
  document: DocumentRecord
  settings: AppSettings
  focusMode: boolean
  onSaveStatusChange: (status: SaveStatus, error?: Error) => void
  onStatsChange: (stats: TextStats) => void
  onCursorChange: (info: CursorInfo | undefined) => void
}

const STATS_DEBOUNCE_MS = 250

/**
 * Renders the right editor for a document's type and wires it to autosave.
 * The parent mounts this with `key={document.id}` so switching documents
 * always produces a fresh instance with its own AutosaveController — no
 * cross-document state to accidentally leak.
 */
export const EditorHost = forwardRef<EditorHostHandle, EditorHostProps>(function EditorHost(
  { document, settings, focusMode, onSaveStatusChange, onStatsChange, onCursorChange },
  ref,
) {
  const [autosave] = useState(() => new AutosaveController(onSaveStatusChange))
  const latestContentRef = useRef(document.content)

  const debouncedStats = useRef(
    debounce((content: DocumentRecord['content']) => {
      const stats = computeTextStats(extractPlainText({ type: document.type, content }))
      onStatsChange(stats)
    }, STATS_DEBOUNCE_MS),
  ).current

  useImperativeHandle(ref, () => ({ flush: () => autosave.flush() }), [autosave])

  useEffect(() => {
    // Initial word count for the freshly loaded document.
    onStatsChange(computeTextStats(extractPlainText(document)))
    onCursorChange(document.type === 'rich' ? undefined : { line: 1, column: 1 })

    // If this document has no version history yet and already has real
    // content, snapshot it now as the start of this editing session. This
    // guarantees there's always something to restore back to even before
    // the first auto-snapshot interval elapses.
    void versionService.list(document.id).then((existing) => {
      if (existing.length > 0) return
      const hasContent = computeTextStats(extractPlainText(document)).words > 0
      if (hasContent) void versionService.create(document.id, document.content, 'session-start')
    })

    return () => {
      debouncedStats.cancel()
      void autosave.flush()
    }
    // Mount-once per document (component is keyed by document.id upstream).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (autosave.hasPendingWork()) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [autosave])

  function handleChange(content: DocumentRecord['content']) {
    latestContentRef.current = content
    autosave.schedule(document.id, content)
    debouncedStats(content)
  }

  return (
    <Suspense fallback={<EditorLoadingFallback />}>
      {document.type === 'rich' && (
        <RichEditor
          initialContent={document.content as RichContent}
          settings={settings}
          focusMode={focusMode}
          autoFocus
          onChange={handleChange}
        />
      )}
      {document.type === 'markdown' && (
        <MarkdownEditor
          initialContent={document.content as string}
          settings={settings}
          autoFocus
          onChange={handleChange}
          onCursorUpdate={onCursorChange}
        />
      )}
      {document.type === 'plaintext' && (
        <PlainTextEditor
          initialContent={document.content as string}
          settings={settings}
          autoFocus
          onChange={handleChange}
          onCursorUpdate={onCursorChange}
        />
      )}
    </Suspense>
  )
})

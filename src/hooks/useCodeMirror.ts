import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState, Compartment, type Extension } from '@codemirror/state'

export interface UseCodeMirrorOptions {
  /** Initial document text. Only read on mount — pass a React `key` at the call site to force a remount when switching documents. */
  doc: string
  extensions: Extension[]
  autoFocus?: boolean
}

/**
 * Creates a CodeMirror 6 `EditorView` bound to a container ref, once per
 * mount, and reconfigures it (without losing cursor/undo history) whenever
 * the `extensions` array identity changes.
 */
export function useCodeMirror({ doc, extensions, autoFocus }: UseCodeMirrorOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const compartmentRef = useRef<Compartment>(undefined)
  const extensionsRef = useRef(extensions)
  extensionsRef.current = extensions

  useEffect(() => {
    if (!containerRef.current) return
    const compartment = new Compartment()
    compartmentRef.current = compartment
    const state = EditorState.create({
      doc,
      extensions: [compartment.of(extensionsRef.current)],
    })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    if (autoFocus) view.focus()
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Intentionally mount-once: callers remount via `key` to load a new document.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!viewRef.current || !compartmentRef.current) return
    viewRef.current.dispatch({ effects: compartmentRef.current.reconfigure(extensions) })
  }, [extensions])

  return { containerRef, viewRef }
}

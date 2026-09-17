import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import { createRichExtensions } from './extensions'
import { RichToolbar } from './RichToolbar'
import type { RichContent } from '../../types/document'
import type { AppSettings } from '../../settings/settingsSchema'

export interface RichEditorProps {
  initialContent: RichContent
  settings: AppSettings
  focusMode: boolean
  autoFocus: boolean
  onChange: (content: RichContent) => void
}

/**
 * Mounted fresh per document (parent passes `key={document.id}`), so
 * switching documents always starts a clean Tiptap instance with the right
 * initial content instead of fighting to reconcile editor state in place.
 */
export function RichEditor({ initialContent, settings, focusMode, autoFocus, onChange }: RichEditorProps) {
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const editor = useEditor({
    extensions: createRichExtensions({ smartQuotes: settings.smartQuotes }),
    content: initialContent as object,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: 'inkline-rich-prose focus:outline-none',
        spellcheck: String(settings.spellcheck),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChangeRef.current(ed.getJSON())
    },
  })

  useEffect(() => {
    if (!editor) return
    editor.setOptions({
      editorProps: {
        attributes: { class: 'inkline-rich-prose focus:outline-none', spellcheck: String(settings.spellcheck) },
      },
    })
  }, [editor, settings.spellcheck])

  const widthClass = {
    narrow: 'max-w-xl',
    medium: 'max-w-3xl',
    wide: 'max-w-4xl',
    full: 'max-w-none',
  }[settings.editorWidth]

  useEffect(() => () => editor?.destroy(), [editor])

  if (!editor) return null

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!focusMode && <RichToolbar editor={editor} />}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={`mx-auto w-full px-6 py-8 sm:px-10 ${widthClass}`}
          style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

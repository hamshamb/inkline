import { EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  keymap,
  lineNumbers as cmLineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { history, defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands'
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { cmBaseTheme, cmSyntaxHighlighting } from './cmTheme'

export interface CmBaseOptions {
  lineWrapping: boolean
  lineNumbers: boolean
  spellcheck: boolean
  placeholder?: string
  onChange: (value: string) => void
  onCursorUpdate?: (info: { line: number; column: number }) => void
}

function cursorInfo(state: EditorState): { line: number; column: number } {
  const pos = state.selection.main.head
  const line = state.doc.lineAt(pos)
  return { line: line.number, column: pos - line.from + 1 }
}

export function createBaseExtensions(opts: CmBaseOptions): Extension[] {
  return [
    ...(opts.lineNumbers ? [cmLineNumbers()] : []),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    history(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    rectangularSelection(),
    crosshairCursor(),
    highlightSelectionMatches(),
    keymap.of([...closeBracketsKeymap, ...searchKeymap, ...historyKeymap, indentWithTab, ...defaultKeymap]),
    ...(opts.lineWrapping ? [EditorView.lineWrapping] : []),
    EditorView.contentAttributes.of({ spellcheck: String(opts.spellcheck) }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) opts.onChange(update.state.doc.toString())
      if (update.docChanged || update.selectionSet) opts.onCursorUpdate?.(cursorInfo(update.state))
    }),
    cmBaseTheme,
    cmSyntaxHighlighting,
  ]
}

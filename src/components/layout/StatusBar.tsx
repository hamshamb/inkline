import { Loader2, Check, AlertCircle } from 'lucide-react'
import type { SaveStatus } from '../../services/autosaveService'
import type { TextStats } from '../../utils/wordCount'
import type { DocumentType } from '../../types/document'
import { DOCUMENT_TYPE_LABELS } from '../sidebar/DocumentTypeIcon'
import type { CursorInfo } from '../../editors/EditorHost'

export interface StatusBarProps {
  stats: TextStats | undefined
  saveStatus: SaveStatus
  documentType: DocumentType | undefined
  cursor: CursorInfo | undefined
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1 text-[var(--color-muted)]">
        <Loader2 size={12} className="animate-spin" aria-hidden />
        Saving…
      </span>
    )
  }
  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1 text-[var(--color-success)]">
        <Check size={12} aria-hidden />
        Saved
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="flex items-center gap-1 text-[var(--color-danger)]">
        <AlertCircle size={12} aria-hidden />
        Save failed
      </span>
    )
  }
  return <span className="text-[var(--color-muted)]">&nbsp;</span>
}

export function StatusBar({ stats, saveStatus, documentType, cursor }: StatusBarProps) {
  return (
    <div
      data-testid="status-bar"
      className="flex h-7 shrink-0 items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-chrome)] px-3 text-xs text-[var(--color-muted)]"
    >
      {stats && (
        <>
          <span>{stats.words} words</span>
          <span className="hidden sm:inline">{stats.characters} characters</span>
          {stats.words > 0 && <span className="hidden sm:inline">{stats.readingTimeMinutes} min read</span>}
        </>
      )}
      {cursor && (
        <span className="hidden sm:inline">
          Ln {cursor.line}, Col {cursor.column}
        </span>
      )}
      <span className="flex-1" />
      {documentType && <span>{DOCUMENT_TYPE_LABELS[documentType]}</span>}
      <SaveIndicator status={saveStatus} />
    </div>
  )
}

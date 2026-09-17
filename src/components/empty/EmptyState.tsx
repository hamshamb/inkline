import { product } from '../../config/product'
import { DocumentTypeIcon, DOCUMENT_TYPE_LABELS } from '../sidebar/DocumentTypeIcon'
import { formatShortcut } from '../../utils/platform'
import type { DocumentType } from '../../types/document'

const TYPES: DocumentType[] = ['rich', 'markdown', 'plaintext']

export interface EmptyStateProps {
  onCreateDocument: (type: DocumentType) => void
}

/** Shown in the main workspace when no document is open — the first thing a new user sees. */
export function EmptyState({ onCreateDocument }: EmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-[var(--color-editor)] px-6 text-center">
      <div>
        <p className="text-sm font-medium tracking-tight text-[var(--color-secondary)]">{product.name}</p>
        <p className="mt-1 text-base text-[var(--color-text)]">Start writing.</p>
      </div>
      <div className="flex items-center gap-2">
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onCreateDocument(type)}
            className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-hover)]"
          >
            <DocumentTypeIcon type={type} className="text-[var(--color-muted)]" />
            {DOCUMENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        <kbd className="rounded border border-[var(--color-border)] px-1.5 py-0.5">{formatShortcut({ key: 'n', mod: true })}</kbd> creates a
        document
      </p>
    </div>
  )
}

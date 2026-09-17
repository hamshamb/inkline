import { useRef, useState } from 'react'
import { Plus, ChevronDown } from 'lucide-react'
import type { DocumentType } from '../../types/document'
import { DocumentTypeIcon, DOCUMENT_TYPE_LABELS } from './DocumentTypeIcon'
import { useOutsideClick } from '../../hooks/useOutsideClick'

const TYPES: DocumentType[] = ['rich', 'markdown', 'plaintext']

export function NewDocumentMenu({ onCreate }: { onCreate: (type: DocumentType) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useOutsideClick(ref, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <div className="flex items-stretch rounded-md border border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => onCreate('rich')}
          className="flex flex-1 items-center gap-1.5 px-2.5 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)]"
        >
          <Plus size={14} className="text-[var(--color-muted)]" aria-hidden />
          New
        </button>
        <button
          type="button"
          aria-label="Choose document type"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-center border-l border-[var(--color-border)] px-1.5 text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
        >
          <ChevronDown size={13} aria-hidden />
        </button>
      </div>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-lg animate-fade-in"
        >
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              role="menuitem"
              onClick={() => {
                onCreate(type)
                setOpen(false)
              }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)]"
            >
              <DocumentTypeIcon type={type} className="text-[var(--color-muted)]" />
              {DOCUMENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

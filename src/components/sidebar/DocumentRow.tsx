import { Pin, MoreHorizontal } from 'lucide-react'
import type { DocumentRecord } from '../../types/document'
import { DocumentTypeIcon } from './DocumentTypeIcon'
import { formatUpdatedAt } from '../../utils/date'
import type { MenuItem } from '../common/ContextMenu'

export interface DocumentRowProps {
  document: DocumentRecord
  active: boolean
  onOpen: () => void
  onContextMenu: (x: number, y: number, items: MenuItem[]) => void
  buildMenuItems: (doc: DocumentRecord) => MenuItem[]
}

export function DocumentRow({ document, active, onOpen, onContextMenu, buildMenuItems }: DocumentRowProps) {
  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e.clientX, e.clientY, buildMenuItems(document))
      }}
      className={`group relative flex w-full items-center gap-2 rounded-md py-1.5 pl-3.5 pr-2.5 text-sm transition-colors duration-100 ${
        active ? 'bg-[var(--color-active)] text-[var(--color-text)]' : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-3.5 w-0.5 -translate-y-1/2 rounded-full bg-[var(--color-accent)]" aria-hidden />
      )}
      <button type="button" onClick={onOpen} aria-current={active ? 'true' : undefined} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        <DocumentTypeIcon type={document.type} className="shrink-0 text-[var(--color-muted)]" />
        <span className="min-w-0 flex-1 truncate">{document.title}</span>
        {document.pinned && <Pin size={11} className="shrink-0 fill-current text-[var(--color-accent)]" aria-label="Pinned" />}
      </button>
      <span className="shrink-0 text-xs text-[var(--color-muted)] group-hover:hidden max-sm:hidden">{formatUpdatedAt(document.updatedAt)}</span>
      <button
        type="button"
        aria-label={`More actions for ${document.title}`}
        onClick={(e) => {
          e.stopPropagation()
          const rect = e.currentTarget.getBoundingClientRect()
          onContextMenu(rect.left, rect.bottom + 4, buildMenuItems(document))
        }}
        className="hidden shrink-0 rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-active)] hover:text-[var(--color-text)] group-hover:block max-sm:block"
      >
        <MoreHorizontal size={14} aria-hidden />
      </button>
    </div>
  )
}

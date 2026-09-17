import { Search, Archive, Trash2, Upload } from 'lucide-react'
import { useDocumentSections } from '../../hooks/useDocumentList'
import { DocumentRow } from './DocumentRow'
import { NewDocumentMenu } from './NewDocumentMenu'
import type { DocumentRecord, DocumentType } from '../../types/document'
import type { MenuItem } from '../common/ContextMenu'

export interface SidebarProps {
  activeDocumentId: string | undefined
  activeView: 'editor' | 'archive' | 'trash'
  onOpenDocument: (id: string) => void
  onCreateDocument: (type: DocumentType) => void
  onOpenQuickOpen: () => void
  onOpenArchive: () => void
  onOpenTrash: () => void
  onImportClick: () => void
  onContextMenu: (x: number, y: number, items: MenuItem[]) => void
  buildMenuItems: (doc: DocumentRecord) => MenuItem[]
}

export function Sidebar({
  activeDocumentId,
  activeView,
  onOpenDocument,
  onCreateDocument,
  onOpenQuickOpen,
  onOpenArchive,
  onOpenTrash,
  onImportClick,
  onContextMenu,
  buildMenuItems,
}: SidebarProps) {
  const { sections, loading } = useDocumentSections()

  return (
    <nav aria-label="Documents" className="flex h-full flex-col bg-[var(--color-chrome)]">
      <div className="flex flex-col gap-2 px-3 pb-2 pt-3">
        <NewDocumentMenu onCreate={onCreateDocument} />
        <button
          type="button"
          onClick={onOpenQuickOpen}
          className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-sm text-[var(--color-muted)] hover:bg-[var(--color-hover)]"
        >
          <Search size={14} aria-hidden />
          Search documents…
        </button>
        <button
          type="button"
          onClick={onImportClick}
          className="flex items-center gap-2 rounded-md px-2.5 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-hover)]"
        >
          <Upload size={12} aria-hidden />
          Import .txt / .md file…
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {loading && <p className="px-2.5 py-2 text-xs text-[var(--color-muted)]">Loading…</p>}
        {!loading && sections.length === 0 && (
          <p className="px-2.5 py-4 text-xs text-[var(--color-muted)]">No documents yet.</p>
        )}
        {sections.map((section) => (
          <div key={section.label} className="mb-1">
            <h3 className="px-2.5 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-[var(--color-muted)]">
              {section.label}
            </h3>
            <div className="flex flex-col gap-0.5">
              {section.documents.map((doc) => (
                <DocumentRow
                  key={doc.id}
                  document={doc}
                  active={activeView === 'editor' && doc.id === activeDocumentId}
                  onOpen={() => onOpenDocument(doc.id)}
                  onContextMenu={onContextMenu}
                  buildMenuItems={buildMenuItems}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-0.5 border-t border-[var(--color-border)] px-2 py-2">
        <button
          type="button"
          onClick={onOpenArchive}
          aria-current={activeView === 'archive' ? 'true' : undefined}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm ${
            activeView === 'archive' ? 'bg-[var(--color-active)] text-[var(--color-text)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <Archive size={14} aria-hidden />
          Archive
        </button>
        <button
          type="button"
          onClick={onOpenTrash}
          aria-current={activeView === 'trash' ? 'true' : undefined}
          className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm ${
            activeView === 'trash' ? 'bg-[var(--color-active)] text-[var(--color-text)]' : 'text-[var(--color-secondary)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <Trash2 size={14} aria-hidden />
          Trash
        </button>
      </div>
    </nav>
  )
}

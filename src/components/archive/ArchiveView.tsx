import { Archive, ArchiveRestore } from 'lucide-react'
import { useArchivedDocuments } from '../../hooks/useDocumentList'
import { documentService } from '../../services/documentService'
import { DocumentTypeIcon } from '../sidebar/DocumentTypeIcon'
import { formatUpdatedAt } from '../../utils/date'
import { useToast } from '../common/ToastProvider'

export interface ArchiveViewProps {
  onOpenDocument: (id: string) => void
}

export function ArchiveView({ onOpenDocument }: ArchiveViewProps) {
  const documents = useArchivedDocuments()
  const { show } = useToast()

  async function unarchive(id: string) {
    await documentService.setArchived(id, false)
    show('Document unarchived', 'success')
  }

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto bg-[var(--color-editor)] px-6 py-8 sm:px-10">
      <h1 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
        <Archive size={14} aria-hidden />
        Archive
      </h1>
      {documents.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">No archived documents.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--color-border)]">
          {documents
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .map((doc) => (
              <li key={doc.id} className="group flex items-center gap-3 py-2.5">
                <DocumentTypeIcon type={doc.type} className="shrink-0 text-[var(--color-muted)]" />
                <button type="button" onClick={() => onOpenDocument(doc.id)} className="min-w-0 flex-1 rounded px-1 py-0.5 -mx-1 text-left hover:bg-[var(--color-hover)]">
                  <p className="truncate text-sm">{doc.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">Updated {formatUpdatedAt(doc.updatedAt)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => unarchive(doc.id)}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
                >
                  <ArchiveRestore size={13} aria-hidden />
                  Unarchive
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}

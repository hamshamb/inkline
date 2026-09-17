import { useState } from 'react'
import { Trash2, RotateCcw, XCircle } from 'lucide-react'
import { useTrashedDocuments } from '../../hooks/useDocumentList'
import { documentService } from '../../services/documentService'
import { DocumentTypeIcon } from '../sidebar/DocumentTypeIcon'
import { formatFullTimestamp } from '../../utils/date'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { useToast } from '../common/ToastProvider'
import type { DocumentRecord } from '../../types/document'

export function TrashView() {
  const documents = useTrashedDocuments()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | undefined>(undefined)
  const [confirmEmpty, setConfirmEmpty] = useState(false)
  const { show } = useToast()

  async function restore(doc: DocumentRecord) {
    await documentService.restoreFromTrash(doc.id)
    show('Document restored', 'success')
  }

  async function deletePermanently(id: string) {
    await documentService.permanentlyDelete(id)
    setConfirmDeleteId(undefined)
    show('Document permanently deleted', 'success')
  }

  async function emptyTrash() {
    await documentService.emptyTrash()
    setConfirmEmpty(false)
    show('Trash emptied', 'success')
  }

  return (
    <div className="mx-auto h-full w-full max-w-2xl overflow-y-auto bg-[var(--color-editor)] px-6 py-8 sm:px-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-[var(--color-secondary)]">
          <Trash2 size={14} aria-hidden />
          Trash
        </h1>
        {documents.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmEmpty(true)}
            className="rounded-md px-2 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-hover)]"
          >
            Empty Trash
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)]">Trash is empty.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--color-border)]">
          {documents
            .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0))
            .map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2.5">
                <DocumentTypeIcon type={doc.type} className="shrink-0 text-[var(--color-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{doc.title}</p>
                  <p className="text-xs text-[var(--color-muted)]">Deleted {doc.deletedAt ? formatFullTimestamp(doc.deletedAt) : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restore(doc)}
                  title="Restore"
                  aria-label={`Restore ${doc.title}`}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
                >
                  <RotateCcw size={13} aria-hidden />
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(doc.id)}
                  title="Delete permanently"
                  aria-label={`Delete ${doc.title} permanently`}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-danger)] hover:bg-[var(--color-hover)]"
                >
                  <XCircle size={13} aria-hidden />
                  Delete
                </button>
              </li>
            ))}
        </ul>
      )}

      <ConfirmDialog
        open={confirmDeleteId !== undefined}
        title="Permanently delete this document?"
        message="This cannot be undone. The document and its version history will be removed for good."
        confirmLabel="Delete permanently"
        danger
        onConfirm={() => confirmDeleteId && deletePermanently(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(undefined)}
      />
      <ConfirmDialog
        open={confirmEmpty}
        title="Empty Trash?"
        message={`This will permanently delete all ${documents.length} document(s) in Trash. This cannot be undone.`}
        confirmLabel="Empty Trash"
        danger
        onConfirm={emptyTrash}
        onCancel={() => setConfirmEmpty(false)}
      />
    </div>
  )
}

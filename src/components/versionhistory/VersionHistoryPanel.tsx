import { useEffect, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { versionService } from '../../services/versionService'
import { formatFullTimestamp } from '../../utils/date'
import { extractPlainText } from '../../documents/textExtract'
import { richToHtml } from '../../export/richSerializer'
import { renderMarkdownToSafeHtml } from '../../editors/markdown/render'
import type { DocumentRecord, RichContent, VersionRecord } from '../../types/document'
import { useToast } from '../common/ToastProvider'
import { escapeHtml } from '../../utils/escapeHtml'

const REASON_LABELS: Record<VersionRecord['reason'], string> = {
  auto: 'Autosave snapshot',
  'session-start': 'Session start',
  'before-restore': 'Before restore',
  'before-import': 'Before import',
  'before-backup-restore': 'Before backup restore',
  manual: 'Manual snapshot',
}

export interface VersionHistoryPanelProps {
  open: boolean
  onClose: () => void
  document: DocumentRecord | undefined
  onRestored: (restored: DocumentRecord) => void
}

function previewHtmlFor(type: DocumentRecord['type'], content: DocumentRecord['content']): string {
  if (type === 'rich') return richToHtml(content as RichContent)
  if (type === 'markdown') return renderMarkdownToSafeHtml(content as string)
  return `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(content as string)}</pre>`
}

export function VersionHistoryPanel({ open, onClose, document, onRestored }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
  const [confirmRestore, setConfirmRestore] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    if (!open || !document) return
    versionService.list(document.id).then((list) => {
      setVersions(list)
      setSelectedId(list[0]?.id)
    })
  }, [open, document])

  const selected = versions.find((v) => v.id === selectedId)

  async function handleRestore() {
    if (!document || !selected) return
    try {
      const restored = await versionService.restore(document.id, selected.id)
      show('Version restored', 'success')
      onRestored(restored)
      onClose()
    } catch {
      show('Could not restore this version.', 'error')
    } finally {
      setConfirmRestore(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Version history" widthClassName="max-w-2xl">
        {!document ? (
          <p className="text-sm text-[var(--color-muted)]">No document selected.</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No snapshots yet. Inkline saves a version periodically as you make meaningful edits.
          </p>
        ) : (
          <div className="flex gap-4">
            <div className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto max-h-96">
              {versions.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`flex flex-col gap-0.5 rounded-md px-2.5 py-2 text-left text-xs ${
                    v.id === selectedId ? 'bg-[var(--color-accent)] text-white' : 'hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <span className="font-medium">{formatFullTimestamp(v.createdAt)}</span>
                  <span className={v.id === selectedId ? 'text-white/75' : 'text-[var(--color-muted)]'}>
                    {v.wordCount} words · {REASON_LABELS[v.reason]}
                  </span>
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1">
              {selected && (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-[var(--color-muted)]">Preview</span>
                    <button
                      type="button"
                      onClick={() => setConfirmRestore(true)}
                      className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
                    >
                      Restore this version
                    </button>
                  </div>
                  <div
                    className="inkline-rich-prose max-h-80 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: previewHtmlFor(document.type, selected.content) }}
                  />
                  <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                    {extractPlainText({ type: document.type, content: selected.content }).length} characters
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>
      <ConfirmDialog
        open={confirmRestore}
        title="Restore this version?"
        message="The document's current content will be saved as a new version first, so you can always undo this restore."
        confirmLabel="Restore"
        onConfirm={handleRestore}
        onCancel={() => setConfirmRestore(false)}
      />
    </>
  )
}

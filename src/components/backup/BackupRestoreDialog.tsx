import { useRef, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { TypeToConfirmDialog } from '../common/TypeToConfirmDialog'
import { backupService, InvalidBackupError, type Backup, type RestoreStrategy } from '../../backup/backupService'
import { downloadTextFile } from '../../export/download'
import { product } from '../../config/product'
import { useToast } from '../common/ToastProvider'
import { Download, Upload } from 'lucide-react'

export interface BackupRestoreDialogProps {
  open: boolean
  onClose: () => void
  onRestored: () => void
}

export function BackupRestoreDialog({ open, onClose, onRestored }: BackupRestoreDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingBackup, setPendingBackup] = useState<Backup | undefined>(undefined)
  const [confirmReplace, setConfirmReplace] = useState(false)
  const [busy, setBusy] = useState(false)
  const { show } = useToast()

  async function handleExport() {
    const backup = await backupService.createBackup()
    const filename = `${product.storageNamespace}-backup-${new Date().toISOString().slice(0, 10)}.json`
    const saved = await downloadTextFile(filename, JSON.stringify(backup, null, 2), 'application/json')
    if (saved) show('Backup file downloaded', 'success')
  }

  async function handleFileSelected(file: File) {
    setBusy(true)
    try {
      const text = await file.text()
      const raw: unknown = JSON.parse(text)
      const backup = backupService.validate(raw)
      setPendingBackup(backup)
    } catch (err) {
      if (err instanceof InvalidBackupError) {
        show(err.message, 'error')
      } else {
        show('This file could not be read as JSON.', 'error')
      }
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function restore(strategy: RestoreStrategy) {
    if (!pendingBackup) return
    setBusy(true)
    try {
      if (strategy === 'replace') {
        // Always protect the current library with a fresh backup before a destructive replace.
        // If the user cancels that save (desktop only — the browser gives no such signal),
        // stop here rather than replacing the library with no safety net.
        const safety = await backupService.createBackup()
        const saved = await downloadTextFile(
          `${product.storageNamespace}-safety-backup-${new Date().toISOString().slice(0, 10)}.json`,
          JSON.stringify(safety, null, 2),
          'application/json',
        )
        if (!saved) {
          show('Replace cancelled — the safety backup was not saved.', 'warning')
          setBusy(false)
          return
        }
      }
      const summary = await backupService.restore(pendingBackup, strategy)
      show(
        strategy === 'replace'
          ? `Library replaced: ${summary.documentsAdded} documents restored.`
          : `Merged: ${summary.documentsAdded} added, ${summary.documentsUpdated} updated, ${summary.documentsSkipped} kept as-is.`,
        'success',
      )
      setPendingBackup(undefined)
      setConfirmReplace(false)
      onRestored()
      onClose()
    } catch {
      show('Restore failed. Your existing data was not modified.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Backup & restore" widthClassName="max-w-md">
        <div className="flex flex-col gap-4 text-sm">
          <section>
            <h3 className="mb-1 font-medium">Export a backup</h3>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Downloads every document, version history, and your settings as a single JSON file.
            </p>
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              <Download size={14} aria-hidden />
              Export full backup
            </button>
          </section>

          <section className="border-t border-[var(--color-border)] pt-4">
            <h3 className="mb-1 font-medium">Restore from a backup</h3>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              The file is validated before anything is written — an invalid file changes nothing.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFileSelected(file)
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-hover)] disabled:opacity-50"
            >
              <Upload size={14} aria-hidden />
              Choose backup file…
            </button>

            {pendingBackup && (
              <div className="mt-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <p className="text-xs">
                  Backup from <strong>{new Date(pendingBackup.exportedAt).toLocaleString()}</strong> —{' '}
                  {pendingBackup.documents.length} document(s), {pendingBackup.versions.length} version(s).
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => restore('merge')}
                    className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                  >
                    Merge into library
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmReplace(true)}
                    className="rounded-md border border-[var(--color-danger)]/50 px-2.5 py-1 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 disabled:opacity-50"
                  >
                    Replace entire library
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </Dialog>

      <TypeToConfirmDialog
        open={confirmReplace}
        title="Replace your entire library?"
        message="Every current document, version, and setting will be deleted and replaced with the contents of this backup. A safety backup of your current library downloads automatically first."
        confirmWord="REPLACE"
        confirmLabel="Replace library"
        onConfirm={() => void restore('replace')}
        onCancel={() => setConfirmReplace(false)}
      />
    </>
  )
}

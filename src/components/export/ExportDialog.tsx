import { Dialog } from '../common/Dialog'
import { availableFormats, exportDocument, type ExportFormat } from '../../export/exportService'
import { copyToClipboard, ClipboardUnavailableError, type CopyFormat } from '../../export/copyService'
import { printDocument } from '../../export/print'
import { useToast } from '../common/ToastProvider'
import { extractPlainText } from '../../documents/textExtract'
import { getShareAdapter } from '../../integrations/shareAdapter'
import type { DocumentRecord } from '../../types/document'
import { Download, Copy, Printer, Share2 } from 'lucide-react'

export interface ExportDialogProps {
  open: boolean
  onClose: () => void
  document: DocumentRecord | undefined
}

const FORMAT_LABELS: Record<ExportFormat, string> = { txt: 'Plain text (.txt)', md: 'Markdown (.md)', html: 'HTML (.html)' }
const COPY_FORMATS: { format: CopyFormat; label: string }[] = [
  { format: 'text', label: 'Copy as plain text' },
  { format: 'markdown', label: 'Copy as Markdown' },
  { format: 'html', label: 'Copy as HTML' },
]

export function ExportDialog({ open, onClose, document }: ExportDialogProps) {
  const { show } = useToast()
  if (!document) return null
  const formats = availableFormats(document.type)
  // Hidden unless a share adapter has been explicitly registered — Inkline
  // ships with none configured, so this stays hidden in v1. See
  // src/integrations/shareAdapter.ts.
  const shareAdapter = getShareAdapter()

  async function handleCopy(format: CopyFormat) {
    if (!document) return
    try {
      await copyToClipboard(document, format)
      show('Copied to clipboard', 'success')
    } catch (err) {
      show(err instanceof ClipboardUnavailableError ? err.message : 'Could not copy to clipboard.', 'error')
    }
  }

  async function handleShare() {
    if (!document || !shareAdapter) return
    try {
      const result = await shareAdapter.share({ title: document.title, format: 'text', content: extractPlainText(document) })
      await navigator.clipboard?.writeText(result.url).catch(() => {})
      show(`Shared via ${shareAdapter.name} — link copied to clipboard`, 'success')
      onClose()
    } catch {
      show(`Could not share via ${shareAdapter.name}.`, 'error')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Export document" widthClassName="max-w-sm">
      <div className="flex flex-col gap-4 text-sm">
        <section>
          <h3 className="mb-2 font-medium">Download</h3>
          <div className="flex flex-col gap-1.5">
            {formats.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => {
                  void exportDocument(document, format)
                  onClose()
                }}
                className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-left text-xs hover:bg-[var(--color-hover)]"
              >
                <Download size={14} aria-hidden />
                {FORMAT_LABELS[format]}
              </button>
            ))}
          </div>
        </section>
        <section className="border-t border-[var(--color-border)] pt-4">
          <h3 className="mb-2 font-medium">Copy</h3>
          <div className="flex flex-col gap-1.5">
            {COPY_FORMATS.map(({ format, label }) => (
              <button
                key={format}
                type="button"
                onClick={() => handleCopy(format)}
                className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-left text-xs hover:bg-[var(--color-hover)]"
              >
                <Copy size={14} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </section>
        <section className="border-t border-[var(--color-border)] pt-4">
          <button
            type="button"
            onClick={() => {
              printDocument(document)
              onClose()
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            <Printer size={14} aria-hidden />
            Print / Save as PDF
          </button>
        </section>
        {shareAdapter && (
          <section className="border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-hover)]"
            >
              <Share2 size={14} aria-hidden />
              Share via {shareAdapter.name}
            </button>
          </section>
        )}
      </div>
    </Dialog>
  )
}

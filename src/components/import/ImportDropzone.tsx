import { useEffect, useState, type ReactNode } from 'react'
import { UploadCloud } from 'lucide-react'
import { importService } from '../../import/importService'
import { useToast } from '../common/ToastProvider'

export interface ImportDropzoneProps {
  children: ReactNode
  onImported: (firstDocumentId: string) => void
}

/**
 * A window-wide drag-and-drop target for importing .txt/.md files. Wraps
 * the whole app so a file can be dropped anywhere, showing an overlay only
 * while a file drag is actually in progress.
 */
export function ImportDropzone({ children, onImported }: ImportDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    let depth = 0

    function isFileDrag(e: DragEvent): boolean {
      return Array.from(e.dataTransfer?.types ?? []).includes('Files')
    }

    function onDragEnter(e: DragEvent) {
      if (!isFileDrag(e)) return
      depth++
      setDragging(true)
    }
    function onDragOver(e: DragEvent) {
      if (!isFileDrag(e)) return
      e.preventDefault()
    }
    function onDragLeave() {
      depth = Math.max(0, depth - 1)
      if (depth === 0) setDragging(false)
    }
    async function onDrop(e: DragEvent) {
      if (!isFileDrag(e)) return
      e.preventDefault()
      depth = 0
      setDragging(false)
      const files = Array.from(e.dataTransfer?.files ?? [])
      if (files.length === 0) return
      await runImport(files)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover', onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop', onDrop)
    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover', onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop', onDrop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runImport(files: File[]) {
    const results = await importService.importFiles(files)
    const succeeded = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)

    if (succeeded.length > 0) {
      show(
        succeeded.length === 1
          ? `Imported "${succeeded[0]?.filename}"`
          : `Imported ${succeeded.length} files`,
        'success',
      )
      const first = succeeded[0]
      if (first?.ok) onImported(first.document.id)
    }
    for (const failure of failed) {
      if (!failure.ok) show(`${failure.filename}: ${failure.reason}`, 'error')
    }
  }

  return (
    <div
      onDrop={(e) => {
        // Also handle drops that land on an element with its own handler,
        // for browsers where the window-level listener alone isn't reached.
        e.preventDefault()
      }}
    >
      {children}
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed border-[var(--color-accent)] bg-[var(--color-elevated)] px-10 py-8 text-center">
            <UploadCloud size={28} className="text-[var(--color-accent)]" aria-hidden />
            <p className="text-sm font-medium">Drop .txt or .md files to import</p>
          </div>
        </div>
      )}
    </div>
  )
}

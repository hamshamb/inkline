import { Dialog } from './Dialog'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} widthClassName="max-w-sm">
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-hover)]"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-md px-3 py-1.5 text-sm font-medium text-white ${
            danger ? 'bg-[var(--color-danger)] hover:opacity-90' : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

import { useState } from 'react'
import { Dialog } from './Dialog'

export interface TypeToConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmWord: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** For the most destructive actions (clearing all data, replacing the library on restore) — a checkbox-level confirm isn't enough friction. */
export function TypeToConfirmDialog({
  open,
  title,
  message,
  confirmWord,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: TypeToConfirmDialogProps) {
  const [value, setValue] = useState('')
  const matches = value.trim() === confirmWord

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      widthClassName="max-w-sm"
    >
      <p className="text-sm text-[var(--color-muted)]">{message}</p>
      <p className="mt-3 text-xs text-[var(--color-muted)]">
        Type <span className="font-mono font-semibold text-[var(--color-text)]">{confirmWord}</span> to confirm.
      </p>
      <input
        autoFocus
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={`Type ${confirmWord} to confirm`}
        autoComplete="off"
        spellCheck={false}
        className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none focus:border-[var(--color-danger)]"
      />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm hover:bg-[var(--color-hover)]">
          Cancel
        </button>
        <button
          type="button"
          disabled={!matches}
          onClick={() => {
            setValue('')
            onConfirm()
          }}
          className="rounded-md bg-[var(--color-danger)] px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}

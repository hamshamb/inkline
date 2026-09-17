import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  widthClassName?: string
  /** 'launcher' drops the title bar chrome for command-palette-style dialogs — the accessible name still comes from `title`. */
  variant?: 'default' | 'launcher'
  /** 'raised' pulls the dialog up from dead-center, appropriate for launcher-style dialogs. */
  align?: 'center' | 'raised'
}

/**
 * Modal built on the native <dialog> element: gives us a real top-layer
 * stacking context, focus trapping, and Escape-to-close for free, with
 * proper accessible semantics.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  widthClassName = 'max-w-lg',
  variant = 'default',
  align = 'center',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handleCancel = (e: Event) => {
      // Let React own the open state instead of the native dialog closing itself.
      e.preventDefault()
      onClose()
    }
    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === el) onClose()
    }
    el.addEventListener('cancel', handleCancel)
    el.addEventListener('click', handleBackdropClick)
    return () => {
      el.removeEventListener('cancel', handleCancel)
      el.removeEventListener('click', handleBackdropClick)
    }
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-label={title}
      aria-describedby={description ? 'dialog-description' : undefined}
      className="w-[calc(100vw-2rem)] rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] p-0 text-[var(--color-text)] shadow-xl backdrop:bg-black/45 open:animate-fade-in"
      style={{ maxWidth: undefined, marginTop: align === 'raised' ? '14vh' : undefined }}
    >
      <div className={`flex max-h-[85vh] w-full flex-col ${widthClassName}`}>
        {variant === 'default' && (
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <h2 className="text-sm font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded p-1 text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
            >
              <X size={16} aria-hidden />
            </button>
          </div>
        )}
        {description && (
          <p id="dialog-description" className="sr-only">
            {description}
          </p>
        )}
        {/* Only rendered while open: besides being wasted work while
            hidden, an always-mounted list (command palette items, shortcut
            tables, etc.) would leave duplicate text nodes in the DOM that
            collide with visually distinct, currently-open dialogs. */}
        <div className={variant === 'launcher' ? 'overflow-y-auto p-2' : 'overflow-y-auto px-4 py-4'}>{open ? children : null}</div>
      </div>
    </dialog>
  )
}

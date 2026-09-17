import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

export interface MenuItem {
  label: string
  icon?: LucideIcon
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  separatorBefore?: boolean
}

export interface ContextMenuState {
  x: number
  y: number
  items: MenuItem[]
}

export function ContextMenu({ state, onClose }: { state: ContextMenuState | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useLayoutEffect(() => {
    if (!state || !ref.current) {
      setPos(null)
      return
    }
    const rect = ref.current.getBoundingClientRect()
    const x = Math.min(state.x, window.innerWidth - rect.width - 8)
    const y = Math.min(state.y, window.innerHeight - rect.height - 8)
    setPos({ x: Math.max(8, x), y: Math.max(8, y) })
    setActiveIndex(0)
  }, [state])

  useEffect(() => {
    if (!state) return
    function handlePointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleKeyDown(e: KeyboardEvent) {
      const items = state?.items ?? []
      const selectable = items.filter((i) => !i.disabled)
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % Math.max(selectable.length, 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + Math.max(selectable.length, 1)) % Math.max(selectable.length, 1))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = selectable[activeIndex]
        if (item) {
          item.onSelect()
          onClose()
        }
      }
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [state, activeIndex, onClose])

  if (!state) return null
  const selectableItems = state.items.filter((i) => !i.disabled)

  return (
    <div
      ref={ref}
      role="menu"
      style={{ position: 'fixed', left: pos?.x ?? state.x, top: pos?.y ?? state.y, visibility: pos ? 'visible' : 'hidden' }}
      className="z-50 min-w-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] py-1 shadow-xl animate-fade-in"
    >
      {state.items.map((item) => {
        const selectableIndex = selectableItems.indexOf(item)
        const isActive = !item.disabled && selectableIndex === activeIndex
        return (
          <div key={item.label}>
            {item.separatorBefore && <div className="my-1 border-t border-[var(--color-border)]" />}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect()
                onClose()
              }}
              onMouseEnter={() => !item.disabled && setActiveIndex(selectableIndex)}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-sm disabled:opacity-40 ${
                item.danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text)]'
              } ${isActive ? 'bg-[var(--color-hover)]' : ''}`}
            >
              {item.icon && <item.icon size={15} aria-hidden />}
              {item.label}
            </button>
          </div>
        )
      })}
    </div>
  )
}

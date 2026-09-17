import { useEffect, useMemo, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { enabledCommands, type CommandContext } from '../../command/registry'
import { formatShortcut } from '../../utils/platform'

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  context: CommandContext
}

export function CommandPalette({ open, onClose, context }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIndex(0)
    }
  }, [open])

  const items = useMemo(() => {
    const all = enabledCommands(context).filter((c) => !c.hidden)
    const q = query.trim().toLowerCase()
    if (q === '') return all
    return all.filter((c) => c.title.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
  }, [context, query])

  function run(index: number) {
    const command = items[index]
    if (!command) return
    onClose()
    command.run(context)
  }

  return (
    <Dialog open={open} onClose={onClose} title="Command palette" widthClassName="max-w-xl" variant="launcher" align="raised">
      <div
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex((i) => Math.min(i + 1, items.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex((i) => Math.max(i - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            run(activeIndex)
          }
        }}
      >
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActiveIndex(0)
          }}
          placeholder="Type a command…"
          className="mb-1 w-full border-b border-[var(--color-border)] bg-transparent px-2 py-2.5 text-sm outline-none placeholder:text-[var(--color-muted)]"
        />
        <div role="listbox" className="max-h-80 overflow-y-auto py-1">
          {items.length === 0 && <p className="px-2.5 py-6 text-center text-sm text-[var(--color-muted)]">No matching commands</p>}
          {items.map((command, i) => (
            <button
              key={command.id}
              type="button"
              role="option"
              aria-selected={i === activeIndex}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => run(i)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm ${
                i === activeIndex ? 'bg-[var(--color-accent)] text-[var(--color-accent-text)]' : 'text-[var(--color-text)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <command.icon size={15} className={i === activeIndex ? undefined : 'text-[var(--color-muted)]'} aria-hidden />
              <span className="flex-1">{command.title}</span>
              {command.shortcut && (
                <kbd className={`text-xs ${i === activeIndex ? 'text-white/70' : 'text-[var(--color-muted)]'}`}>
                  {formatShortcut(command.shortcut)}
                </kbd>
              )}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  )
}

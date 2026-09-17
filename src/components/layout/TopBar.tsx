import { Menu, Search, Sun, Moon, Laptop, Focus } from 'lucide-react'
import { product } from '../../config/product'
import { useSettings } from '../../settings/SettingsProvider'
import { modKeyLabel } from '../../utils/platform'

export interface TopBarProps {
  onOpenSidebarDrawer: () => void
  onOpenQuickOpen: () => void
  focusMode: boolean
  onExitFocusMode: () => void
}

const THEME_ICONS = { system: Laptop, light: Sun, dark: Moon } as const

export function TopBar({ onOpenSidebarDrawer, onOpenQuickOpen, focusMode, onExitFocusMode }: TopBarProps) {
  const { settings, update } = useSettings()
  const ThemeIcon = THEME_ICONS[settings.theme]

  function cycleTheme() {
    const order: (typeof settings.theme)[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(settings.theme) + 1) % order.length]
    update({ theme: next ?? 'system' })
  }

  if (focusMode) {
    return (
      <div className="flex h-11 shrink-0 items-center justify-end border-b border-[var(--color-border)] bg-[var(--color-chrome)] px-3">
        <button
          type="button"
          onClick={onExitFocusMode}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
        >
          <Focus size={13} aria-hidden />
          Exit focus mode
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-chrome)] px-3">
      <button
        type="button"
        onClick={onOpenSidebarDrawer}
        aria-label="Open document list"
        className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] md:hidden"
      >
        <Menu size={17} aria-hidden />
      </button>
      <span className="text-sm font-semibold tracking-tight">{product.name}</span>
      <button
        type="button"
        onClick={onOpenQuickOpen}
        className="mx-auto flex w-full max-w-xs items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-muted)] hover:border-[var(--color-border-strong)]"
      >
        <Search size={12} aria-hidden />
        Search
        <kbd className="ml-auto rounded border border-[var(--color-border)] px-1 text-[10px]">{modKeyLabel()}K</kbd>
      </button>
      <button
        type="button"
        onClick={cycleTheme}
        aria-label={`Theme: ${settings.theme}. Click to change.`}
        title={`Theme: ${settings.theme}`}
        className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)]"
      >
        <ThemeIcon size={16} aria-hidden />
      </button>
    </div>
  )
}

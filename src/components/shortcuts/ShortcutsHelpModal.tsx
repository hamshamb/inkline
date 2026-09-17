import { Dialog } from '../common/Dialog'
import { commands } from '../../command/registry'
import { formatShortcut, type ShortcutSpec } from '../../utils/platform'

interface StaticShortcut {
  label: string
  shortcut: ShortcutSpec
  context: string
}

const STATIC_SHORTCUTS: StaticShortcut[] = [
  { label: 'Bold', shortcut: { key: 'b', mod: true }, context: 'Rich' },
  { label: 'Italic', shortcut: { key: 'i', mod: true }, context: 'Rich' },
  { label: 'Underline', shortcut: { key: 'u', mod: true }, context: 'Rich' },
  { label: 'Undo', shortcut: { key: 'z', mod: true }, context: 'All editors' },
  { label: 'Redo', shortcut: { key: 'z', mod: true, shift: true }, context: 'All editors' },
  { label: 'Find', shortcut: { key: 'f', mod: true }, context: 'Markdown / Plain text' },
  { label: 'Replace', shortcut: { key: 'h', mod: true }, context: 'Markdown / Plain text' },
]

export function ShortcutsHelpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const registryShortcuts = commands.filter((c) => c.shortcut)

  return (
    <Dialog open={open} onClose={onClose} title="Keyboard shortcuts" widthClassName="max-w-lg">
      <table className="w-full text-left text-sm">
        <tbody>
          {registryShortcuts.map((c) => (
            <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-1.5 pr-3">{c.title}</td>
              <td className="py-1.5 text-right text-xs text-[var(--color-muted)]">
                <kbd>{formatShortcut(c.shortcut as ShortcutSpec)}</kbd>
              </td>
            </tr>
          ))}
          {STATIC_SHORTCUTS.map((s) => (
            <tr key={s.label} className="border-b border-[var(--color-border)] last:border-0">
              <td className="py-1.5 pr-3">
                {s.label}
                <span className="ml-1.5 text-xs text-[var(--color-muted)]">({s.context})</span>
              </td>
              <td className="py-1.5 text-right text-xs text-[var(--color-muted)]">
                <kbd>{formatShortcut(s.shortcut)}</kbd>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  )
}

import {
  FileText,
  FileCode,
  File,
  FolderOpen,
  Pencil,
  Copy,
  Pin,
  Archive,
  Trash2,
  Download,
  Printer,
  PanelLeft,
  Focus,
  SunMoon,
  Settings,
  Keyboard,
  DatabaseBackup,
  Search,
  type LucideIcon,
} from 'lucide-react'
import type { DocumentType } from '../types/document'
import type { ShortcutSpec } from '../utils/platform'

export interface CommandContext {
  hasActiveDocument: boolean
  isActiveDocumentPinned: boolean
  createDocument: (type: DocumentType) => void
  openQuickOpen: () => void
  openCommandPalette: () => void
  renameActiveDocument: () => void
  duplicateActiveDocument: () => void
  togglePinActiveDocument: () => void
  archiveActiveDocument: () => void
  trashActiveDocument: () => void
  openExportDialog: () => void
  printActiveDocument: () => void
  toggleSidebar: () => void
  toggleFocusMode: () => void
  toggleTheme: () => void
  openSettings: () => void
  openShortcutsHelp: () => void
  createBackup: () => void
  openVersionHistory: () => void
  forceSaveActiveDocument: () => void
}

export interface Command {
  id: string
  title: string
  group: 'Create' | 'Navigate' | 'Document' | 'View' | 'App'
  icon: LucideIcon
  shortcut?: ShortcutSpec
  /** Hidden commands are reachable only via their shortcut, not listed in the command palette. */
  hidden?: boolean
  run: (ctx: CommandContext) => void
  enabled?: (ctx: CommandContext) => boolean
}

export const commands: Command[] = [
  {
    id: 'new-rich',
    title: 'New Rich Document',
    group: 'Create',
    icon: FileText,
    shortcut: { key: 'n', mod: true },
    run: (ctx) => ctx.createDocument('rich'),
  },
  {
    id: 'new-markdown',
    title: 'New Markdown Document',
    group: 'Create',
    icon: FileCode,
    run: (ctx) => ctx.createDocument('markdown'),
  },
  {
    id: 'new-plaintext',
    title: 'New Plain Text Document',
    group: 'Create',
    icon: File,
    run: (ctx) => ctx.createDocument('plaintext'),
  },
  {
    id: 'quick-open',
    title: 'Open document…',
    group: 'Navigate',
    icon: FolderOpen,
    shortcut: { key: 'p', mod: true },
    run: (ctx) => ctx.openQuickOpen(),
  },
  {
    id: 'rename',
    title: 'Rename document',
    group: 'Document',
    icon: Pencil,
    run: (ctx) => ctx.renameActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'duplicate',
    title: 'Duplicate document',
    group: 'Document',
    icon: Copy,
    run: (ctx) => ctx.duplicateActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'toggle-pin',
    title: 'Pin / Unpin document',
    group: 'Document',
    icon: Pin,
    run: (ctx) => ctx.togglePinActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'archive',
    title: 'Archive document',
    group: 'Document',
    icon: Archive,
    run: (ctx) => ctx.archiveActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'trash',
    title: 'Move to Trash',
    group: 'Document',
    icon: Trash2,
    run: (ctx) => ctx.trashActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'export',
    title: 'Export document…',
    group: 'Document',
    icon: Download,
    run: (ctx) => ctx.openExportDialog(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'print',
    title: 'Print / Save as PDF',
    group: 'Document',
    icon: Printer,
    shortcut: { key: 'p', mod: true, shift: true },
    run: (ctx) => ctx.printActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'version-history',
    title: 'Version history',
    group: 'Document',
    icon: DatabaseBackup,
    run: (ctx) => ctx.openVersionHistory(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
  {
    id: 'toggle-sidebar',
    title: 'Toggle sidebar',
    group: 'View',
    icon: PanelLeft,
    shortcut: { key: '\\', mod: true },
    run: (ctx) => ctx.toggleSidebar(),
  },
  {
    id: 'toggle-focus-mode',
    title: 'Toggle focus mode',
    group: 'View',
    icon: Focus,
    shortcut: { key: '.', mod: true },
    run: (ctx) => ctx.toggleFocusMode(),
  },
  {
    id: 'toggle-theme',
    title: 'Toggle theme',
    group: 'View',
    icon: SunMoon,
    run: (ctx) => ctx.toggleTheme(),
  },
  {
    id: 'open-settings',
    title: 'Open settings',
    group: 'App',
    icon: Settings,
    shortcut: { key: ',', mod: true },
    run: (ctx) => ctx.openSettings(),
  },
  {
    id: 'shortcuts-help',
    title: 'Open keyboard shortcuts',
    group: 'App',
    icon: Keyboard,
    shortcut: { key: '/', mod: true },
    run: (ctx) => ctx.openShortcutsHelp(),
  },
  {
    id: 'create-backup',
    title: 'Create backup',
    group: 'App',
    icon: DatabaseBackup,
    run: (ctx) => ctx.createBackup(),
  },
  {
    id: 'command-palette',
    title: 'Command palette',
    group: 'App',
    icon: Search,
    shortcut: { key: 'k', mod: true },
    run: (ctx) => ctx.openCommandPalette(),
  },
  {
    id: 'force-save',
    title: 'Save now',
    group: 'App',
    icon: DatabaseBackup,
    shortcut: { key: 's', mod: true },
    hidden: true,
    run: (ctx) => ctx.forceSaveActiveDocument(),
    enabled: (ctx) => ctx.hasActiveDocument,
  },
]

export function enabledCommands(ctx: CommandContext): Command[] {
  return commands.filter((c) => !c.enabled || c.enabled(ctx))
}

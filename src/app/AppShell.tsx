import { useEffect, useRef, useState } from 'react'
import {
  Pencil,
  Copy,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  Download,
  FolderOpen,
} from 'lucide-react'
import { Sidebar } from '../components/sidebar/Sidebar'
import { TopBar } from '../components/layout/TopBar'
import { StatusBar } from '../components/layout/StatusBar'
import { DocumentTitleBar } from '../components/editorheader/DocumentTitleBar'
import { EditorHost, type EditorHostHandle } from '../editors/EditorHost'
import { ContextMenu, type ContextMenuState, type MenuItem } from '../components/common/ContextMenu'
import { ConfirmDialog } from '../components/common/ConfirmDialog'
import { QuickOpen } from '../components/quickopen/QuickOpen'
import { CommandPalette } from '../components/commandpalette/CommandPalette'
import { VersionHistoryPanel } from '../components/versionhistory/VersionHistoryPanel'
import { SettingsPanel } from '../components/settings/SettingsPanel'
import { BackupRestoreDialog } from '../components/backup/BackupRestoreDialog'
import { ExportDialog } from '../components/export/ExportDialog'
import { PrivacyPage } from '../components/privacy/PrivacyPage'
import { ShortcutsHelpModal } from '../components/shortcuts/ShortcutsHelpModal'
import { TrashView } from '../components/trash/TrashView'
import { ArchiveView } from '../components/archive/ArchiveView'
import { ImportDropzone } from '../components/import/ImportDropzone'
import { EmptyState } from '../components/empty/EmptyState'
import { importService } from '../import/importService'
import { useSettings } from '../settings/SettingsProvider'
import { useToast } from '../components/common/ToastProvider'
import { useDocument } from '../hooks/useDocumentList'
import { documentService } from '../services/documentService'
import { printDocument } from '../export/print'
import { useGlobalShortcuts } from '../command/useGlobalShortcuts'
import { getLastActiveDocumentId, setLastActiveDocumentId } from './lastActiveDocument'
import type { CommandContext } from '../command/registry'
import type { DocumentRecord, DocumentType } from '../types/document'
import type { SaveStatus } from '../services/autosaveService'
import type { TextStats } from '../utils/wordCount'
import type { CursorInfo } from '../editors/EditorHost'
import { useMediaQuery } from '../hooks/useMediaQuery'

type MainView = 'editor' | 'archive' | 'trash'

export function AppShell() {
  const { settings, update: updateSettings } = useSettings()
  const { show } = useToast()

  const [activeView, setActiveView] = useState<MainView>('editor')
  const [activeDocumentId, setActiveDocumentId] = useState<string | undefined>(undefined)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarDrawerOpen, setSidebarDrawerOpen] = useState(false)

  const [quickOpenOpen, setQuickOpenOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [confirmTrashId, setConfirmTrashId] = useState<string | undefined>(undefined)

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [stats, setStats] = useState<TextStats | undefined>(undefined)
  const [cursor, setCursor] = useState<CursorInfo | undefined>(undefined)
  // Bumped whenever a document's content is replaced out from under the open
  // editor (version restore) so EditorHost remounts with the fresh content
  // instead of silently autosaving stale in-memory text over the restore.
  const [editorInstanceKey, setEditorInstanceKey] = useState(0)
  // Holds the exact record a version restore just wrote, so the remounted
  // EditorHost gets it directly instead of racing the live-query
  // subscription (which may not have re-emitted yet at this point).
  const [documentOverride, setDocumentOverride] = useState<DocumentRecord | undefined>(undefined)

  const editorHostRef = useRef<EditorHostHandle>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const liveActiveDocument = useDocument(activeDocumentId)
  const activeDocument = documentOverride?.id === activeDocumentId ? documentOverride : liveActiveDocument

  /** Sets the active document and remembers it so a reload resumes here. */
  function setActiveDoc(id: string | undefined) {
    setActiveDocumentId(id)
    setLastActiveDocumentId(id)
    setDocumentOverride(undefined)
  }

  // Once the live-query subscription catches up to (or passes) the
  // restored snapshot, drop the override so title/tags/pin/etc. go back to
  // tracking live edits instead of the frozen restored-at moment.
  useEffect(() => {
    if (
      documentOverride &&
      liveActiveDocument &&
      liveActiveDocument.id === documentOverride.id &&
      liveActiveDocument.updatedAt >= documentOverride.updatedAt
    ) {
      setDocumentOverride(undefined)
    }
  }, [liveActiveDocument, documentOverride])

  // On first mount, resume whatever document was open last time — otherwise
  // reloading the tab would always drop back to an empty "select a
  // document" state even though the content itself was never at risk.
  useEffect(() => {
    const lastId = getLastActiveDocumentId()
    if (!lastId) return
    documentService.get(lastId).then((doc) => {
      if (doc && doc.deletedAt === null) {
        setActiveDocumentId(lastId)
      } else {
        setLastActiveDocumentId(undefined)
      }
    })
    // Runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function flushActiveEditor() {
    if (editorHostRef.current) await editorHostRef.current.flush()
  }

  async function openDocument(id: string) {
    await flushActiveEditor()
    setActiveView('editor')
    setActiveDoc(id)
    setSidebarDrawerOpen(false)
    void documentService.touchLastOpened(id)
  }

  async function createDocument(type: DocumentType) {
    await flushActiveEditor()
    const doc = await documentService.create(type)
    setActiveView('editor')
    setActiveDoc(doc.id)
    setSidebarDrawerOpen(false)
  }

  async function duplicateDocument(id: string) {
    const copy = await documentService.duplicate(id)
    show('Document duplicated', 'success')
    void openDocument(copy.id)
  }

  async function handleImportFileInput(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    const results = await importService.importFiles(Array.from(fileList))
    const succeeded = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)
    if (succeeded.length > 0) {
      show(succeeded.length === 1 ? `Imported "${succeeded[0]?.filename}"` : `Imported ${succeeded.length} files`, 'success')
      const first = succeeded[0]
      if (first?.ok) void openDocument(first.document.id)
    }
    for (const failure of failed) {
      if (!failure.ok) show(`${failure.filename}: ${failure.reason}`, 'error')
    }
    if (importInputRef.current) importInputRef.current.value = ''
  }

  async function togglePin(doc: DocumentRecord) {
    await documentService.setPinned(doc.id, !doc.pinned)
  }

  async function toggleArchive(doc: DocumentRecord) {
    await documentService.setArchived(doc.id, !doc.archived)
    show(doc.archived ? 'Document unarchived' : 'Document archived', 'success')
  }

  async function trashDocument(id: string) {
    await documentService.moveToTrash(id)
    setConfirmTrashId(undefined)
    if (activeDocumentId === id) setActiveDoc(undefined)
    show('Moved to Trash', 'success', {
      label: 'Undo',
      onClick: () => void documentService.restoreFromTrash(id),
    })
  }

  function buildMenuItems(doc: DocumentRecord): MenuItem[] {
    return [
      { label: 'Open', icon: FolderOpen, onSelect: () => void openDocument(doc.id) },
      {
        label: 'Rename',
        icon: Pencil,
        onSelect: () => {
          void openDocument(doc.id).then(() => setTimeout(() => titleInputRef.current?.select(), 50))
        },
      },
      { label: 'Duplicate', icon: Copy, onSelect: () => void duplicateDocument(doc.id) },
      {
        label: doc.pinned ? 'Unpin' : 'Pin',
        icon: doc.pinned ? PinOff : Pin,
        onSelect: () => void togglePin(doc),
        separatorBefore: true,
      },
      {
        label: doc.archived ? 'Unarchive' : 'Archive',
        icon: doc.archived ? ArchiveRestore : Archive,
        onSelect: () => void toggleArchive(doc),
      },
      {
        label: 'Export…',
        icon: Download,
        onSelect: () => {
          void openDocument(doc.id).then(() => setExportOpen(true))
        },
        separatorBefore: true,
      },
      {
        label: 'Move to Trash',
        icon: Trash2,
        danger: true,
        onSelect: () => setConfirmTrashId(doc.id),
      },
    ]
  }

  // Not memoized: every field is either a cheap derived boolean or a closure
  // over stable singletons/setState functions, so there's no benefit to
  // memoizing and no staleness risk from rebuilding it each render.
  const commandContext: CommandContext = {
    hasActiveDocument: Boolean(activeDocument),
    isActiveDocumentPinned: Boolean(activeDocument?.pinned),
    createDocument: (type) => void createDocument(type),
    openQuickOpen: () => setQuickOpenOpen(true),
    openCommandPalette: () => setCommandPaletteOpen(true),
    renameActiveDocument: () => {
      titleInputRef.current?.focus()
      titleInputRef.current?.select()
    },
    duplicateActiveDocument: () => activeDocument && void duplicateDocument(activeDocument.id),
    togglePinActiveDocument: () => activeDocument && void togglePin(activeDocument),
    archiveActiveDocument: () => activeDocument && void toggleArchive(activeDocument),
    trashActiveDocument: () => activeDocument && setConfirmTrashId(activeDocument.id),
    openExportDialog: () => setExportOpen(true),
    printActiveDocument: () => {
      if (activeDocument) printDocument(activeDocument)
    },
    toggleSidebar: () => updateSettings({ sidebarVisible: !settings.sidebarVisible }),
    toggleFocusMode: () => setFocusMode((v) => !v),
    toggleTheme: () => {
      const order: (typeof settings.theme)[] = ['system', 'light', 'dark']
      const next = order[(order.indexOf(settings.theme) + 1) % order.length]
      updateSettings({ theme: next ?? 'system' })
    },
    openSettings: () => setSettingsOpen(true),
    openShortcutsHelp: () => setShortcutsOpen(true),
    createBackup: () => setBackupOpen(true),
    openVersionHistory: () => setVersionHistoryOpen(true),
    forceSaveActiveDocument: () => {
      void flushActiveEditor().then(() => show('Saved', 'success'))
    },
  }

  useGlobalShortcuts(commandContext, !quickOpenOpen && !commandPaletteOpen)

  // Escape exits focus mode from anywhere, without trapping navigation.
  useEffect(() => {
    if (!focusMode) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setFocusMode(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [focusMode])

  // Rendered with JS (not just CSS breakpoint classes) so only one Sidebar
  // instance ever exists in the DOM at a time — two hidden-but-mounted
  // copies would double up every interactive element's accessible name,
  // which is both bad for assistive tech and for automated testing.
  const isDesktopViewport = useMediaQuery('(min-width: 768px)')
  const showPersistentSidebar = isDesktopViewport && settings.sidebarVisible && !focusMode

  return (
    <ImportDropzone onImported={(id) => void openDocument(id)}>
    <div className="flex h-dvh w-full overflow-hidden">
      <input
        ref={importInputRef}
        type="file"
        multiple
        accept=".txt,.md,.markdown"
        className="hidden"
        onChange={(e) => void handleImportFileInput(e.target.files)}
      />
      {showPersistentSidebar && (
        <div className="shrink-0 border-r border-[var(--color-border)] md:w-60 lg:w-64">
          <Sidebar
            activeDocumentId={activeDocumentId}
            activeView={activeView}
            onOpenDocument={openDocument}
            onCreateDocument={createDocument}
            onOpenQuickOpen={() => setQuickOpenOpen(true)}
            onOpenArchive={() => setActiveView('archive')}
            onOpenTrash={() => setActiveView('trash')}
            onImportClick={() => importInputRef.current?.click()}
            onContextMenu={(x, y, items) => setContextMenu({ x, y, items })}
            buildMenuItems={buildMenuItems}
          />
        </div>
      )}

      {sidebarDrawerOpen && !isDesktopViewport && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarDrawerOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-[var(--color-border)] bg-[var(--color-chrome)]">
            <Sidebar
              activeDocumentId={activeDocumentId}
              activeView={activeView}
              onOpenDocument={openDocument}
              onCreateDocument={createDocument}
              onOpenQuickOpen={() => setQuickOpenOpen(true)}
              onOpenArchive={() => {
                setActiveView('archive')
                setSidebarDrawerOpen(false)
              }}
              onOpenTrash={() => {
                setActiveView('trash')
                setSidebarDrawerOpen(false)
              }}
              onImportClick={() => importInputRef.current?.click()}
              onContextMenu={(x, y, items) => setContextMenu({ x, y, items })}
              buildMenuItems={buildMenuItems}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onOpenSidebarDrawer={() => setSidebarDrawerOpen(true)}
          onOpenQuickOpen={() => setQuickOpenOpen(true)}
          focusMode={focusMode}
          onExitFocusMode={() => setFocusMode(false)}
        />

        <div className="min-h-0 flex-1 overflow-hidden">
          {activeView === 'trash' && <TrashView />}
          {activeView === 'archive' && <ArchiveView onOpenDocument={openDocument} />}
          {activeView === 'editor' &&
            (activeDocument ? (
              <div className="flex h-full min-h-0 flex-col bg-[var(--color-editor)]">
                <DocumentTitleBar ref={titleInputRef} document={activeDocument} focusMode={focusMode} />
                <div className="min-h-0 flex-1">
                  <EditorHost
                    key={`${activeDocument.id}:${editorInstanceKey}`}
                    ref={editorHostRef}
                    document={activeDocument}
                    settings={settings}
                    focusMode={focusMode}
                    onSaveStatusChange={(status, error) => {
                      setSaveStatus(status)
                      if (status === 'error') {
                        const isQuotaError = error?.name === 'QuotaExceededError'
                        show(
                          isQuotaError
                            ? "Storage is full — this change wasn't saved. Export a backup and free up space."
                            : "Couldn't save your last change. It's still here — try again or export a copy.",
                          'error',
                        )
                      }
                    }}
                    onStatsChange={setStats}
                    onCursorChange={setCursor}
                  />
                </div>
              </div>
            ) : (
              <EmptyState onCreateDocument={createDocument} />
            ))}
        </div>

        {activeView === 'editor' && activeDocument && !focusMode && (
          <StatusBar stats={stats} saveStatus={saveStatus} documentType={activeDocument.type} cursor={cursor} />
        )}
      </div>

      <ContextMenu state={contextMenu} onClose={() => setContextMenu(null)} />

      <QuickOpen open={quickOpenOpen} onClose={() => setQuickOpenOpen(false)} onOpenDocument={openDocument} />
      <CommandPalette open={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} context={commandContext} />
      <VersionHistoryPanel
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        document={activeDocument ?? undefined}
        onRestored={(restored) => {
          setDocumentOverride(restored)
          setEditorInstanceKey((k) => k + 1)
        }}
      />
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onOpenBackup={() => {
          setSettingsOpen(false)
          setBackupOpen(true)
        }}
        onOpenPrivacy={() => {
          setSettingsOpen(false)
          setPrivacyOpen(true)
        }}
      />
      <BackupRestoreDialog
        open={backupOpen}
        onClose={() => setBackupOpen(false)}
        onRestored={() => {
          // A merge/replace can add, update, or remove the document that was
          // open; safest is to drop back to the library rather than risk an
          // editor instance holding content for a row that changed shape.
          setActiveDoc(undefined)
          setEditorInstanceKey((k) => k + 1)
        }}
      />
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} document={activeDocument ?? undefined} />
      <PrivacyPage open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <ShortcutsHelpModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <ConfirmDialog
        open={confirmTrashId !== undefined}
        title="Move to Trash?"
        message="You can restore this document from Trash at any time before it's permanently deleted."
        confirmLabel="Move to Trash"
        danger
        onConfirm={() => confirmTrashId && void trashDocument(confirmTrashId)}
        onCancel={() => setConfirmTrashId(undefined)}
      />
    </div>
    </ImportDropzone>
  )
}

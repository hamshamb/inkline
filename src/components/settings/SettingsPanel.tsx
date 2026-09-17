import { useEffect, useState } from 'react'
import { Dialog } from '../common/Dialog'
import { TypeToConfirmDialog } from '../common/TypeToConfirmDialog'
import { useSettings } from '../../settings/SettingsProvider'
import { clearAllData, estimateStorageUsage } from '../../db/schema'
import { useToast } from '../common/ToastProvider'
import type { EditorWidth, ThemePreference } from '../../settings/settingsSchema'

export interface SettingsPanelProps {
  open: boolean
  onClose: () => void
  onOpenBackup: () => void
  onOpenPrivacy: () => void
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm">{label}</p>
        {description && <p className="text-xs text-[var(--color-muted)]">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-strong)]'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
      />
    </button>
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function SettingsPanel({ open, onClose, onOpenBackup, onOpenPrivacy }: SettingsPanelProps) {
  const { settings, update, reset } = useSettings()
  const [storage, setStorage] = useState<{ usageBytes: number; quotaBytes: number } | undefined>(undefined)
  const [confirmClear, setConfirmClear] = useState(false)
  const { show } = useToast()

  useEffect(() => {
    if (open) estimateStorageUsage().then(setStorage)
  }, [open])

  async function handleClearData() {
    try {
      await clearAllData()
      show('Application data cleared', 'success')
      setConfirmClear(false)
      window.location.reload()
    } catch {
      show('Could not clear application data.', 'error')
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Settings" widthClassName="max-w-md">
        <div className="flex flex-col divide-y divide-[var(--color-border)]">
          <section className="pb-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Appearance</h3>
            <SettingRow label="Theme">
              <select
                value={settings.theme}
                onChange={(e) => update({ theme: e.target.value as ThemePreference })}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </SettingRow>
          </section>

          <section className="py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Editor</h3>
            <SettingRow label="Font size" description={`${settings.fontSize}px`}>
              <input
                type="range"
                min={12}
                max={24}
                value={settings.fontSize}
                onChange={(e) => update({ fontSize: Number(e.target.value) })}
                className="w-28"
              />
            </SettingRow>
            <SettingRow label="Line height" description={settings.lineHeight.toFixed(2)}>
              <input
                type="range"
                min={1.2}
                max={2.2}
                step={0.05}
                value={settings.lineHeight}
                onChange={(e) => update({ lineHeight: Number(e.target.value) })}
                className="w-28"
              />
            </SettingRow>
            <SettingRow label="Editor width">
              <select
                value={settings.editorWidth}
                onChange={(e) => update({ editorWidth: e.target.value as EditorWidth })}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm"
              >
                <option value="narrow">Narrow</option>
                <option value="medium">Medium</option>
                <option value="wide">Wide</option>
                <option value="full">Full</option>
              </select>
            </SettingRow>
            <SettingRow label="Word wrap" description="Markdown & Plain text editors">
              <Toggle checked={settings.wordWrap} onChange={(v) => update({ wordWrap: v })} label="Word wrap" />
            </SettingRow>
            <SettingRow label="Line numbers" description="Markdown & Plain text editors">
              <Toggle checked={settings.lineNumbers} onChange={(v) => update({ lineNumbers: v })} label="Line numbers" />
            </SettingRow>
            <SettingRow label="Spellcheck">
              <Toggle checked={settings.spellcheck} onChange={(v) => update({ spellcheck: v })} label="Spellcheck" />
            </SettingRow>
          </section>

          <section className="py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Writing</h3>
            <SettingRow label="Smart quotes" description="Curly quotes in Rich documents">
              <Toggle checked={settings.smartQuotes} onChange={(v) => update({ smartQuotes: v })} label="Smart quotes" />
            </SettingRow>
          </section>

          <section className="py-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Privacy & data</h3>
            <p className="mb-2 text-xs text-[var(--color-muted)]">
              Everything you write stays on this device.{' '}
              <button type="button" onClick={onOpenPrivacy} className="underline hover:text-[var(--color-text)]">
                Read the privacy page
              </button>
              .
            </p>
            {storage && (
              <p className="mb-2 text-xs text-[var(--color-muted)]">
                Using approximately {formatBytes(storage.usageBytes)} of {formatBytes(storage.quotaBytes)} available.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenBackup}
                className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-hover)]"
              >
                Backup & restore…
              </button>
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--color-hover)]"
              >
                Reset settings
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="rounded-md border border-[var(--color-danger)]/50 px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
              >
                Clear application data…
              </button>
            </div>
          </section>
        </div>
      </Dialog>

      <TypeToConfirmDialog
        open={confirmClear}
        title="Clear all application data?"
        message="This permanently deletes every document, version, and setting stored in this browser. Export a backup first if you want to keep anything."
        confirmWord="DELETE"
        confirmLabel="Clear everything"
        onConfirm={handleClearData}
        onCancel={() => setConfirmClear(false)}
      />
    </>
  )
}

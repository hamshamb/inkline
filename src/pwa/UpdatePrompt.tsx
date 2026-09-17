import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw } from 'lucide-react'

/**
 * `registerType: 'prompt'` (see vite.config.ts) means the new service worker
 * install-but-wait until the user chooses to reload. We never auto-reload:
 * that could silently discard in-memory content someone is mid-sentence on.
 * Autosave means it's already on disk by the time they do reload, but the
 * choice of *when* stays theirs.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => {
      console.error('Service worker registration failed', error)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed inset-x-0 bottom-4 z-[110] flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-2.5 text-sm shadow-xl">
        <RefreshCw size={15} className="text-[var(--color-accent)]" aria-hidden />
        <span>An update is ready.</span>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="rounded-md bg-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          Reload to update
        </button>
        <button
          type="button"
          onClick={() => setNeedRefresh(false)}
          className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          Later
        </button>
      </div>
    </div>
  )
}

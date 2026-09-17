import { isTauri } from '@tauri-apps/api/core'
import { SettingsProvider } from './settings/SettingsProvider'
import { ToastProvider } from './components/common/ToastProvider'
import { AppShell } from './app/AppShell'
import { UpdatePrompt } from './pwa/UpdatePrompt'
import { ErrorBoundary } from './app/ErrorBoundary'
import { StorageGate } from './app/StorageGate'

// The service worker / "update available" flow is a browser-PWA concept:
// it exists to safely refresh a tab to a newer deployed build. The desktop
// build already ships a fixed version per installer and updates by
// installing a new one, so registering a service worker there would be
// pointless at best. Not mounting <UpdatePrompt/> means its `useRegisterSW`
// hook — and therefore any service worker registration — never runs under
// Tauri, without touching the browser code path at all.
const runningInDesktopApp = isTauri()

export default function App() {
  return (
    <ErrorBoundary>
      <StorageGate>
        <SettingsProvider>
          <ToastProvider>
            <AppShell />
            {!runningInDesktopApp && <UpdatePrompt />}
          </ToastProvider>
        </SettingsProvider>
      </StorageGate>
    </ErrorBoundary>
  )
}

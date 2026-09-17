import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { settingsService } from './settingsService'
import { DEFAULT_SETTINGS, type AppSettings } from './settingsSchema'
import { applyThemeToDom, resolveTheme, systemPrefersDark } from './theme'

interface SettingsContextValue {
  settings: AppSettings
  ready: boolean
  update: (patch: Partial<AppSettings>) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    settingsService.load().then((loaded) => {
      if (!cancelled) {
        setSettings(loaded)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Apply/re-apply the resolved theme whenever the preference changes, and
  // whenever the OS-level preference changes while "system" is selected.
  useEffect(() => {
    applyThemeToDom(resolveTheme(settings.theme))
    if (settings.theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyThemeToDom(systemPrefersDark() ? 'dark' : 'light')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme])

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      void settingsService.save(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    void settingsService.reset()
  }, [])

  const value = useMemo(() => ({ settings, ready, update, reset }), [settings, ready, update, reset])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider')
  return ctx
}

import { useEffect, useRef } from 'react'
import { commands, type CommandContext } from './registry'
import { matchesShortcut } from '../utils/platform'

/**
 * Installs a single document-level keydown listener that matches registered
 * command shortcuts. Runs at the app root so shortcuts work regardless of
 * focus, while individual editors still handle their own shortcuts (bold,
 * undo, find, etc.) since those need editor-specific selection state.
 *
 * `ctx` is read through a ref so a fresh object every render doesn't cause
 * the listener to be torn down and reattached constantly.
 */
export function useGlobalShortcuts(ctx: CommandContext, enabled = true): void {
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  useEffect(() => {
    if (!enabled) return

    function onKeyDown(e: KeyboardEvent) {
      const current = ctxRef.current
      for (const command of commands) {
        if (!command.shortcut) continue
        if (!matchesShortcut(e, command.shortcut)) continue
        if (command.enabled && !command.enabled(current)) continue
        e.preventDefault()
        command.run(current)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}

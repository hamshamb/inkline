import { isTauri } from '@tauri-apps/api/core'
import { downloadTextFileBrowser } from './downloadBrowser'

/**
 * Saves a text file to the user's device. Same call for both builds — the
 * browser build triggers a normal `<a download>`, the desktop build shows
 * a native "Save As" dialog (see downloadTauri.ts). Callers don't need to
 * know which one they're running in.
 *
 * Resolves to false only if the user cancelled the desktop save dialog —
 * always true in the browser, which gives no such signal.
 */
export async function downloadTextFile(filename: string, content: string, mimeType: string): Promise<boolean> {
  if (isTauri()) {
    const { downloadTextFileTauri } = await import('./downloadTauri')
    return downloadTextFileTauri(filename, content)
  }
  return downloadTextFileBrowser(filename, content, mimeType)
}

/** Sanitizes a document title into a safe filename fragment. */
export function slugifyFilename(title: string): string {
  const slug = title
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 100)
  return slug === '' ? 'untitled' : slug
}

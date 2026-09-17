/**
 * Desktop (Tauri) implementation of the same "save a text file" operation
 * the browser build does with `<a download>`. A WebView has no reliable
 * native "Save As" behavior for that trick, so on desktop we use Tauri's
 * dialog plugin to let the user pick a destination, then write exactly
 * that file — nothing else on disk is ever touched, and no path is read
 * back. See src-tauri/capabilities/default.json for the exact (narrow)
 * permission this relies on.
 *
 * Returns false if the user cancelled the save dialog, true once the file
 * has actually been written — callers that gate a destructive action on
 * "did the safety backup really get saved" need that distinction.
 */
export async function downloadTextFileTauri(filename: string, content: string): Promise<boolean> {
  const [{ save }, { writeTextFile }] = await Promise.all([
    import('@tauri-apps/plugin-dialog'),
    import('@tauri-apps/plugin-fs'),
  ])

  const extension = filename.includes('.') ? filename.split('.').pop() : undefined
  const path = await save({
    defaultPath: filename,
    filters: extension ? [{ name: extension.toUpperCase(), extensions: [extension] }] : undefined,
  })

  if (!path) return false

  await writeTextFile(path, content)
  return true
}

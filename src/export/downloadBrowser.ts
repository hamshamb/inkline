/**
 * Browser implementation: triggers a normal `<a download>` file save. No
 * network involved. The browser gives us no way to detect a user
 * cancelling their own download-manager UI, so this always reports success
 * once the trigger has fired.
 */
export function downloadTextFileBrowser(filename: string, content: string, mimeType: string): true {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return true
}

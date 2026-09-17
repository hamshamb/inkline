import type { Page } from '@playwright/test'

/** Clears all local state (IndexedDB, localStorage) so each test starts from a clean slate. */
export async function resetAppState(page: Page): Promise<void> {
  await page.goto('/')
  await page.evaluate(async () => {
    localStorage.clear()
    const dbs = await indexedDB.databases?.()
    await Promise.all((dbs ?? []).map((d) => d.name && indexedDB.deleteDatabase(d.name)))
  })
  await page.reload()
}

export async function createDocument(page: Page, type: 'rich' | 'markdown' | 'plaintext' = 'rich') {
  if (type === 'rich') {
    await page.getByRole('button', { name: 'New', exact: true }).click()
    return
  }
  await page.getByLabel('Choose document type').click()
  const label = type === 'markdown' ? 'Markdown' : 'Plain text'
  await page.getByRole('menuitem', { name: label }).click()
}

import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('quick open (Cmd/Ctrl+P) finds a document by title and opens it', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Findable Title')
  await page.getByLabel('Document title').blur()
  await page.getByRole('button', { name: 'New', exact: true }).click() // a second, unrelated document

  await page.keyboard.press('Control+p')
  const dialog = page.getByRole('dialog', { name: 'Quick open' })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('Search documents by title or content…').fill('Findable')
  await expect(dialog.getByText('Findable Title').first()).toBeVisible()
  await page.keyboard.press('Enter')

  await expect(dialog).toBeHidden()
  await expect(page.getByLabel('Document title')).toHaveValue('Findable Title')
})

test('search finds a match inside document content with an excerpt', async ({ page }) => {
  await resetAppState(page)
  await page.getByLabel('Choose document type').click()
  await page.getByRole('menuitem', { name: 'Plain text' }).click()
  await page.locator('.cm-content').click()
  await page.keyboard.type('an unusual word: zephyrwing appears here')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'New', exact: true }).click() // switch away

  await page.keyboard.press('Control+p')
  const quickOpen = page.getByRole('dialog', { name: 'Quick open' })
  await quickOpen.getByPlaceholder('Search documents by title or content…').fill('zephyrwing')
  await expect(quickOpen.getByText(/zephyrwing/i).first()).toBeVisible()
})

test('command palette (Cmd/Ctrl+K) runs a command', async ({ page }) => {
  await resetAppState(page)
  await page.keyboard.press('Control+k')
  const dialog = page.getByRole('dialog', { name: 'Command palette' })
  await expect(dialog).toBeVisible()
  await dialog.getByPlaceholder('Type a command…').fill('New Markdown')
  await page.keyboard.press('Enter')

  await expect(dialog).toBeHidden()
  await expect(page.locator('.cm-content')).toBeVisible()
})

test('command palette toggles focus mode', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Toggle focus mode')
  await page.keyboard.press('Enter')

  await expect(page.getByRole('navigation', { name: 'Documents' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Exit focus mode' })).toBeVisible()

  await page.getByRole('button', { name: 'Exit focus mode' }).click()
  await expect(page.getByRole('navigation', { name: 'Documents' })).toBeVisible()
})

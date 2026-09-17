import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('rapid typing then immediate document switch does not lose content', async ({ page }) => {
  await resetAppState(page)

  await page.getByLabel('Choose document type').click()
  await page.getByRole('menuitem', { name: 'Plain text' }).click()
  await page.getByLabel('Document title').fill('Doc A')
  await page.getByLabel('Document title').blur()
  await page.locator('.cm-content').click()
  await page.keyboard.type('Content for document A', { delay: 5 })

  // Switch away immediately, before the debounce would normally have fired.
  await page.getByLabel('Choose document type').click()
  await page.getByRole('menuitem', { name: 'Plain text' }).click()
  await page.getByLabel('Document title').fill('Doc B')
  await page.getByLabel('Document title').blur()
  await page.locator('.cm-content').click()
  await page.keyboard.type('Content for document B', { delay: 5 })

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Doc A').click()
  await expect(page.locator('.cm-content')).toContainText('Content for document A')

  await sidebar.getByText('Doc B').click()
  await expect(page.locator('.cm-content')).toContainText('Content for document B')

  await page.reload()
  await sidebar.getByText('Doc A').click()
  await expect(page.locator('.cm-content')).toContainText('Content for document A')
})

test('reloading during a pending autosave does not lose the last edit', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  const editor = page.locator('.inkline-rich-prose')
  await editor.click()
  await page.keyboard.type('Content typed right before reload')

  // Wait past the ~500ms autosave debounce, but not for a full navigation cycle.
  await page.waitForTimeout(700)
  await page.reload()

  await expect(page.locator('.inkline-rich-prose')).toContainText('Content typed right before reload')
})

test('word count and character count update as you type', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.locator('.inkline-rich-prose').click()
  await page.keyboard.type('one two three four five')

  await expect(page.getByText('5 words')).toBeVisible()
})

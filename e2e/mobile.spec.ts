import { test, expect, devices } from '@playwright/test'
import { resetAppState } from './helpers'

// Pixel 7 uses the Chromium engine (already installed), unlike the iOS
// device profiles which imply WebKit.
test.use({ ...devices['Pixel 7'] })

test('sidebar is a drawer on mobile and the editor remains usable', async ({ page }) => {
  await resetAppState(page)

  // The persistent sidebar is not shown at mobile widths.
  const sidebarNav = page.getByRole('navigation', { name: 'Documents' })
  await expect(sidebarNav).toHaveCount(0)

  await page.getByLabel('Open document list').click()
  await expect(page.getByRole('navigation', { name: 'Documents' })).toBeVisible()
  await page.getByRole('button', { name: 'New', exact: true }).click()

  const editor = page.locator('.inkline-rich-prose')
  await editor.click()
  await page.keyboard.type('Writing from a phone-sized viewport')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  // No horizontal overflow at mobile width.
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  expect(hasHorizontalScroll).toBe(false)
})

test('markdown editor falls back to Source/Preview toggle instead of a forced split at mobile widths', async ({ page }) => {
  await resetAppState(page)
  await page.getByLabel('Open document list').click()
  await page.getByLabel('Choose document type').click()
  await page.getByRole('menuitem', { name: 'Markdown' }).click()

  await expect(page.getByRole('button', { name: 'Split', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Source', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible()
})

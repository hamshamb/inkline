import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('Ctrl+N creates a new rich document', async ({ page }) => {
  await resetAppState(page)
  await page.keyboard.press('Control+n')
  await expect(page.locator('.inkline-rich-prose')).toBeVisible()
})

test('Ctrl+B/I/U toggle rich formatting marks', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  const editor = page.locator('.inkline-rich-prose')
  await editor.click()
  await page.keyboard.type('format me')
  await page.keyboard.press('Control+a')

  await page.keyboard.press('Control+b')
  await expect(editor.locator('strong')).toHaveText('format me')

  await page.keyboard.press('Control+i')
  await expect(editor.locator('em')).toHaveText('format me')

  await page.keyboard.press('Control+u')
  await expect(editor.locator('u')).toHaveText('format me')
})

test('Ctrl+S forces an immediate save', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.locator('.inkline-rich-prose').click()
  await page.keyboard.type('save me now')
  await page.keyboard.press('Control+s')
  await expect(page.getByTestId('status-bar').getByText('Saved', { exact: true })).toBeVisible()
})

test('Escape exits focus mode', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Toggle focus mode')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: 'Exit focus mode' })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('navigation', { name: 'Documents' })).toBeVisible()
})

test('the shortcuts help modal lists shortcuts', async ({ page }) => {
  await resetAppState(page)
  await page.keyboard.press('Control+/')
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible()
  await expect(page.getByText('New Rich Document')).toBeVisible()
})

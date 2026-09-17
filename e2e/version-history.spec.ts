import { test, expect } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { resetAppState } from './helpers'

test('version history lets you preview and restore an older version', async ({ page }) => {
  await resetAppState(page)

  // Importing a file creates a document with content but no version
  // history yet (import bypasses the autosave path entirely) — opening it
  // is what triggers Inkline's "snapshot the start of this editing
  // session" version, giving us something real to restore to.
  const tmpFile = path.join(os.tmpdir(), `inkline-e2e-version-${Date.now()}.txt`)
  await fs.writeFile(tmpFile, 'first draft of the document')
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Import .txt / .md file…').click(),
  ])
  await chooser.setFiles(tmpFile)
  await expect(page.locator('.cm-content')).toContainText('first draft of the document')

  await page.locator('.cm-content').click()
  await page.keyboard.press('Control+a')
  await page.keyboard.type('second draft replaces everything')
  await expect(page.getByTestId('status-bar').getByText('Saved', { exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Version history')
  await page.keyboard.press('Enter')

  const dialog = page.getByRole('dialog', { name: 'Version history' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('Session start')).toBeVisible()
  await expect(dialog.getByText('first draft of the document')).toBeVisible()

  await dialog.getByRole('button', { name: 'Restore this version' }).click()
  await page.getByRole('button', { name: 'Restore', exact: true }).click()

  await expect(page.getByText('Version restored')).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('first draft of the document')

  await fs.unlink(tmpFile).catch(() => {})
})

test('opening version history for a document with no snapshots yet shows an empty state', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Version history')
  await page.keyboard.press('Enter')

  await expect(page.getByText(/No snapshots yet/i)).toBeVisible()
})

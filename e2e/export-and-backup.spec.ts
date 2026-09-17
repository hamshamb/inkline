import { test, expect } from '@playwright/test'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs/promises'
import { resetAppState } from './helpers'

test('export a document as plain text downloads a .txt file', async ({ page }) => {
  await resetAppState(page)
  await page.getByLabel('Choose document type').click()
  await page.getByRole('menuitem', { name: 'Plain text' }).click()
  await page.getByLabel('Document title').fill('Export Target')
  await page.getByLabel('Document title').blur()
  await page.locator('.cm-content').click()
  await page.keyboard.type('content to export')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Export document')
  await page.keyboard.press('Enter')

  const downloadPromise = page.waitForEvent('download')
  await page.getByText('Plain text (.txt)').click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('Export Target.txt')
})

test('importing a .txt file via the file picker creates a new plain text document', async ({ page }) => {
  await resetAppState(page)
  const tmpFile = path.join(os.tmpdir(), `inkline-e2e-import-${Date.now()}.txt`)
  await fs.writeFile(tmpFile, 'imported plain text content')

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Import .txt / .md file…').click(),
  ])
  await chooser.setFiles(tmpFile)

  await expect(page.getByText(/Imported "/)).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('imported plain text content')

  await fs.unlink(tmpFile).catch(() => {})
})

test('dropping a .md file onto the window imports it as markdown', async ({ page }) => {
  await resetAppState(page)

  // Simulate a real OS file drag by dispatching DataTransfer-carrying drag
  // events, since Playwright can't drag actual filesystem files from the host.
  await page.evaluate(() => {
    const file = new File(['# Dropped Heading\n\nBody'], 'dropped.md', { type: 'text/markdown' })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    const dispatch = (type: string) =>
      window.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }))
    dispatch('dragenter')
    dispatch('dragover')
    dispatch('drop')
  })

  await expect(page.getByText('Imported "dropped.md"')).toBeVisible()
  await expect(page.locator('.cm-content')).toContainText('Dropped Heading')
})

test('export a full backup, then restore it via merge into a fresh library', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Backed Up Doc')
  await page.getByLabel('Document title').blur()
  // Renaming writes straight to IndexedDB (no debounce); confirm it landed
  // by waiting for the sidebar to reflect it before backing up.
  await expect(page.getByRole('navigation', { name: 'Documents' }).getByText('Backed Up Doc')).toBeVisible()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Create backup')
  await page.keyboard.press('Enter')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export full backup' }).click()
  const download = await downloadPromise
  const backupPath = path.join(os.tmpdir(), `inkline-e2e-backup-${Date.now()}.json`)
  await download.saveAs(backupPath)

  // Simulate restoring into a fresh, empty library.
  await resetAppState(page)
  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Create backup')
  await page.keyboard.press('Enter')

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Choose backup file…').click(),
  ])
  await chooser.setFiles(backupPath)

  await expect(page.getByText(/document\(s\)/)).toBeVisible()
  await page.getByText('Merge into library').click()
  await expect(page.getByText(/Merged:/)).toBeVisible()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await expect(sidebar.getByText('Backed Up Doc')).toBeVisible()

  await fs.unlink(backupPath).catch(() => {})
})

test('restoring an invalid backup file shows a clear error and changes nothing', async ({ page }) => {
  await resetAppState(page)
  const badFile = path.join(os.tmpdir(), `inkline-e2e-bad-backup-${Date.now()}.json`)
  await fs.writeFile(badFile, JSON.stringify({ not: 'a backup' }))

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Create backup')
  await page.keyboard.press('Enter')

  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByText('Choose backup file…').click(),
  ])
  await chooser.setFiles(badFile)

  await expect(page.getByText(/not a valid Inkline backup/i)).toBeVisible()
  await fs.unlink(badFile).catch(() => {})
})

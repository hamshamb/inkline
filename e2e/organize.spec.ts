import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('rename a document from the title field', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('My Renamed Document')
  await page.getByLabel('Document title').blur()

  await expect(page.getByRole('navigation', { name: 'Documents' }).getByText('My Renamed Document')).toBeVisible()
})

test('duplicate a document via the sidebar context menu', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Original Doc')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Original Doc').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Duplicate' }).click()

  await expect(sidebar.getByText('Original Doc (copy)')).toBeVisible()
  await expect(sidebar.getByText('Original Doc', { exact: true })).toBeVisible()
})

test('pin and unpin a document', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Pin Me')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Pin Me').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Pin' }).click()
  await expect(sidebar.getByText('Pinned')).toBeVisible()

  await sidebar.getByText('Pin Me').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Unpin' }).click()
  await expect(sidebar.getByText('Pinned')).toHaveCount(0)
})

test('archive a document, find it in Archive, and unarchive it', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Archive Me')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Archive Me').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Archive' }).click()
  await expect(sidebar.getByText('Archive Me')).toHaveCount(0)

  await sidebar.getByText('Archive', { exact: true }).click()
  await expect(page.getByText('Archive Me')).toBeVisible()

  await page.getByRole('button', { name: 'Unarchive' }).click()
  await expect(page.getByText('No archived documents.')).toBeVisible()
})

test('move a document to Trash and restore it', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Trash Me')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Trash Me').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to Trash' }).click()
  await page.getByRole('button', { name: 'Move to Trash' }).last().click()

  await expect(sidebar.getByText('Trash Me')).toHaveCount(0)

  await sidebar.getByText('Trash', { exact: true }).click()
  await expect(page.getByText('Trash Me')).toBeVisible()
  await page.getByRole('button', { name: 'Restore' }).click()

  await expect(page.getByText('Trash is empty.')).toBeVisible()
})

test('permanently deleting from Trash requires confirmation', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Delete Forever')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Delete Forever').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to Trash' }).click()
  await page.getByRole('button', { name: 'Move to Trash' }).last().click()

  await sidebar.getByText('Trash', { exact: true }).click()
  await page.getByRole('button', { name: 'Delete Forever permanently' }).click()
  await expect(page.getByText('Permanently delete this document?')).toBeVisible()
  await page.getByRole('button', { name: 'Delete permanently' }).click()

  await expect(page.getByText('Trash is empty.')).toBeVisible()
})

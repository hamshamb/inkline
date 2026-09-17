import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test.describe('Rich document', () => {
  test('create, format text, reload, and content survives', async ({ page }) => {
    await resetAppState(page)

    await page.getByRole('button', { name: 'New', exact: true }).click()
    const editor = page.locator('.inkline-rich-prose')
    await editor.click()
    await page.keyboard.type('Hello Inkline')

    // Select the typed text and bold it via the toolbar.
    await page.keyboard.press('Control+A')
    await page.getByRole('button', { name: 'Bold' }).click()

    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 5000 })

    await page.reload()
    await expect(page.locator('.inkline-rich-prose strong')).toHaveText('Hello Inkline')
  })

  test('supports headings, lists, and undo/redo', async ({ page }) => {
    await resetAppState(page)
    await page.getByRole('button', { name: 'New', exact: true }).click()

    const editor = page.locator('.inkline-rich-prose')
    await editor.click()
    await page.getByRole('button', { name: 'Heading 1' }).click()
    await page.keyboard.type('Title')
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Bullet list' }).click()
    await page.keyboard.type('first item')

    await expect(page.locator('.inkline-rich-prose h1')).toHaveText('Title')
    await expect(page.locator('.inkline-rich-prose li')).toContainText('first item')

    await page.keyboard.press('Control+z')
    await expect(page.locator('.inkline-rich-prose')).not.toContainText('first item')

    await page.keyboard.press('Control+Shift+z')
    await expect(page.locator('.inkline-rich-prose li')).toContainText('first item')
  })
})

test.describe('Markdown document', () => {
  test('create, type, switch Source/Split/Preview, reload, content survives', async ({ page }) => {
    await resetAppState(page)
    await page.getByLabel('Choose document type').click()
    await page.getByRole('menuitem', { name: 'Markdown' }).click()

    const source = page.locator('.cm-content')
    await source.click()
    await page.keyboard.type('# My Markdown Doc\n\nSome **bold** text.')

    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.locator('.inkline-rich-prose h1')).toHaveText('My Markdown Doc')

    await page.getByRole('button', { name: 'Split', exact: true }).click()
    await expect(page.locator('.cm-content')).toBeVisible()
    await expect(page.locator('.inkline-rich-prose')).toBeVisible()

    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 5000 })
    await page.reload()
    await expect(page.locator('.cm-content')).toContainText('My Markdown Doc')
  })
})

test.describe('Plain text document', () => {
  test('create, type, reload, content survives', async ({ page }) => {
    await resetAppState(page)
    await page.getByLabel('Choose document type').click()
    await page.getByRole('menuitem', { name: 'Plain text' }).click()

    const editor = page.locator('.cm-content')
    await editor.click()
    await page.keyboard.type('Just plain text, no formatting.')

    await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 5000 })
    await page.reload()
    await expect(page.locator('.cm-content')).toContainText('Just plain text, no formatting.')
  })

  test('plain text never gets markdown or rich formatting applied', async ({ page }) => {
    await resetAppState(page)
    await page.getByLabel('Choose document type').click()
    await page.getByRole('menuitem', { name: 'Plain text' }).click()

    await expect(page.getByRole('toolbar', { name: 'Formatting' })).toHaveCount(0)
    const editor = page.locator('.cm-content')
    await editor.click()
    await page.keyboard.type('# not a heading')
    await expect(page.locator('.cm-content')).toContainText('# not a heading')
    await expect(page.locator('h1')).toHaveCount(0)
  })
})

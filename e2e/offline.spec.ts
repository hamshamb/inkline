import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('the app keeps working fully offline after the first load', async ({ page, context }) => {
  await resetAppState(page)

  // Let the service worker finish installing/activating and precaching the
  // app shell before we cut the network.
  await page.evaluate(async () => {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.ready
    }
  })

  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Offline Doc One')
  await page.getByLabel('Document title').blur()
  await page.locator('.inkline-rich-prose').click()
  await page.keyboard.type('Written while still online')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await context.setOffline(true)

  await page.reload()
  await expect(page.locator('.inkline-rich-prose')).toContainText('Written while still online')

  // Editing, autosaving, and creating new documents all work with no network.
  await page.locator('.inkline-rich-prose').click()
  await page.keyboard.type(' — continued offline.')
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'New', exact: true }).click()
  await page.getByLabel('Document title').fill('Offline Doc Two')
  await page.getByLabel('Document title').blur()

  const sidebar = page.getByRole('navigation', { name: 'Documents' })
  await sidebar.getByText('Offline Doc One').click()
  await expect(page.locator('.inkline-rich-prose')).toContainText('continued offline')

  // Search also works without a network round-trip.
  await page.keyboard.press('Control+p')
  const quickOpen = page.getByRole('dialog', { name: 'Quick open' })
  await quickOpen.getByPlaceholder('Search documents by title or content…').fill('Offline Doc Two')
  await expect(quickOpen.getByText('Offline Doc Two').first()).toBeVisible()
  await page.keyboard.press('Escape')

  await page.reload()
  await expect(sidebar.getByText('Offline Doc One')).toBeVisible()
  await expect(sidebar.getByText('Offline Doc Two')).toBeVisible()

  await context.setOffline(false)
})

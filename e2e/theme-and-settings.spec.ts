import { test, expect } from '@playwright/test'
import { resetAppState } from './helpers'

test('theme toggle cycles system -> light -> dark and persists across reload', async ({ page }) => {
  await resetAppState(page)

  const html = page.locator('html')
  await expect(html).toHaveAttribute('data-theme', /light|dark/)

  const themeButton = page.getByLabel(/^Theme:/)
  await themeButton.click()
  await expect(html).toHaveAttribute('data-theme', 'light')

  await themeButton.click()
  await expect(html).toHaveAttribute('data-theme', 'dark')

  await page.reload()
  await expect(html).toHaveAttribute('data-theme', 'dark')
})

test('settings changes to font size are reflected and persisted', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Open settings')
  await page.keyboard.press('Enter')

  const fontSizeSlider = page.getByRole('slider').first()
  await fontSizeSlider.evaluate((el, val) => {
    const input = el as HTMLInputElement
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
    setter?.call(input, val)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }, '22')
  await page.keyboard.press('Escape')

  await page.reload()
  const editorContainer = page.locator('.inkline-rich-prose').locator('xpath=..')
  await expect(editorContainer).toHaveCSS('font-size', '22px')
})

test('clearing application data requires typing the confirmation word', async ({ page }) => {
  await resetAppState(page)
  await page.getByRole('button', { name: 'New', exact: true }).click()

  await page.keyboard.press('Control+k')
  await page.getByPlaceholder('Type a command…').fill('Open settings')
  await page.keyboard.press('Enter')

  await page.getByText('Clear application data…').click()
  const confirmButton = page.getByRole('button', { name: 'Clear everything' })
  await expect(confirmButton).toBeDisabled()

  await page.getByLabel('Type DELETE to confirm').fill('DELETE')
  await expect(confirmButton).toBeEnabled()
})

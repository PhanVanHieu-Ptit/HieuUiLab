import { expect, test } from '@playwright/test'

test('navigates from home to the Button page and switches a demo to code', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Browse components' }).click()
  await expect(page).toHaveURL(/\/components$/)

  await page
    .getByRole('navigation', { name: 'Registry' })
    .getByRole('link', { name: 'Button' })
    .click()
  await expect(page).toHaveURL(/\/components\/button$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()

  const tablist = page.getByRole('tablist', { name: 'Variants example' })
  await tablist.getByRole('tab', { name: 'Code' }).click()
  await expect(tablist.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('tabpanel', { name: 'Code' })).toContainText(
    'export function ButtonVariantsDemo',
  )
  await expect(page.getByRole('button', { name: 'Copy code' }).first()).toBeVisible()
})

test('toggles and persists the dark theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/components/button')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Switch to dark theme' }).click()
  await expect(html).toHaveClass(/dark/)

  await page.reload()
  await expect(html).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Switch to light theme' })).toBeVisible()
})

test('first Tab press reaches the skip link, which moves focus to main', async ({ page }) => {
  await page.goto('/components/button')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Skip to content' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#main')).toBeFocused()
})

test('unknown routes render the not-found page', async ({ page }) => {
  await page.goto('/nope')
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible()
})

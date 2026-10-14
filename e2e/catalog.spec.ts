import { expect, test } from '@playwright/test'

test.describe('component catalog', () => {
  test('searches, filters, clears, and opens an entry', async ({ page }) => {
    await page.goto('/components')
    const status = page.getByRole('status').filter({ hasText: /components$/ })
    const total = await status.textContent()

    await page.getByRole('searchbox', { name: 'Search components' }).fill('modal')
    await expect(page).toHaveURL(/\/components\?q=modal$/)
    const results = page.getByRole('list', { name: 'Components results' })
    await expect(results.getByRole('heading', { level: 2 })).toHaveCount(2)

    await page.getByRole('button', { name: 'focus-trap', pressed: false }).click()
    await expect(page).toHaveURL(/q=modal&tag=focus-trap$/)
    await page.getByRole('button', { name: 'Remove search “modal”' }).click()
    await expect(page).toHaveURL(/\/components\?tag=focus-trap$/)

    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(status).toHaveText(total ?? '')

    await page.getByRole('searchbox', { name: 'Search components' }).fill('buton')
    await page
      .getByRole('navigation', { name: 'Search suggestions' })
      .getByRole('link', { name: 'Button' })
      .click()
    await expect(page).toHaveURL(/\/components\/button$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Button' })).toBeVisible()
  })
})

test.describe('component detail', () => {
  test('playground controls change the live component and the copied code', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/components/button')

    const playground = page.getByRole('region', { name: 'Playground' })
    const preview = playground.getByRole('group', { name: 'Button preview' }).getByRole('button')
    await expect(preview).toHaveText('Save changes')

    const controls = playground.getByRole('form', { name: 'Playground controls' })
    await controls.getByRole('textbox', { name: 'Label' }).fill('Publish')
    await controls.getByRole('combobox', { name: 'Variant' }).selectOption('outline')
    await controls.getByRole('switch', { name: 'Disabled' }).click()

    await expect(preview).toHaveText('Publish')
    await expect(preview).toBeDisabled()

    await playground.getByRole('tab', { name: 'Code' }).click()
    await page.getByRole('button', { name: 'Copy playground code' }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('<Button variant="outline" disabled>Publish</Button>')
    expect(copied).toContain("import { Button } from '@/components/ui/button'")
  })

  test('Usage and Source tabs work from the keyboard and copy the source', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/components/kbd')

    const code = page.getByRole('region', { name: 'Code' })
    await code.getByRole('tab', { name: 'Usage' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(code.getByRole('tab', { name: 'Source' })).toBeFocused()
    await expect(code.getByRole('tabpanel', { name: 'Source' })).toContainText(
      'export function Kbd',
    )

    await page.getByRole('button', { name: 'Copy kbd.tsx' }).click()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toContain('export function Kbd')
  })

  test('the category crumb returns to the filtered catalog', async ({ page }) => {
    await page.goto('/components/button')
    await page
      .getByRole('navigation', { name: 'Breadcrumb' })
      .getByRole('link', { name: 'Actions' })
      .click()
    await expect(page).toHaveURL(/\/components\?category=actions$/)
    await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue('actions')
  })
})

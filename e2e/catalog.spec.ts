import { expect, test } from './fixtures'

test.describe('component catalog', () => {
  // The search box shows the URL's value, and the URL is written as the visitor types. Written in a
  // transition, the box was put back to its previous text before the new text arrived, so keys
  // pressed in quick succession were lost. The driver sends keys with no pause between them.
  test('keeps every character typed in quick succession, at the end and in the middle', async ({
    page,
  }) => {
    await page.goto('/components')
    const search = page.getByRole('searchbox', { name: 'Search components' })

    await search.click()
    await page.keyboard.type('checkbox')
    await expect(search).toHaveValue('checkbox')
    await expect(page).toHaveURL(/\/components\?q=checkbox$/)

    await search.fill('')
    await expect(page).toHaveURL(/\/components$/)
    await search.click()
    await page.keyboard.type('buton')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.type('t')
    await expect(search).toHaveValue('button')
    await expect(page).toHaveURL(/\/components\?q=button$/)
  })

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

  test('says when nothing matches, and the empty state clears the search', async ({ page }) => {
    await page.goto('/components')
    const status = page.getByRole('status').filter({ hasText: /components$/ })
    const total = /^(\d+) components$/.exec((await status.textContent()) ?? '')?.[1]
    expect(total, 'the catalog states how many components it lists').toBeDefined()

    const search = page.getByRole('searchbox', { name: 'Search components' })
    await search.fill('zzzzqx')
    await expect(
      page.getByRole('heading', { level: 2, name: 'No components match these filters' }),
    ).toBeVisible()
    await expect(page.getByText('Nothing matches “zzzzqx”')).toBeVisible()
    await expect(status).toHaveText(`0 of ${total ?? ''} components`)
    await expect(page.getByRole('list', { name: 'Components results' })).toHaveCount(0)

    // Two buttons share this name while a filter is active: the filter bar's comes first on the
    // page and the empty state's last, and the empty state is what this test is about.
    await expect(page.getByRole('button', { name: 'Clear filters' })).toHaveCount(2)
    await page.getByRole('button', { name: 'Clear filters' }).last().click()

    await expect(page).toHaveURL(/\/components$/)
    await expect(search).toHaveValue('')
    await expect(status).toHaveText(`${total ?? ''} components`)
    await expect(page.getByRole('list', { name: 'Components results' })).toBeVisible()
  })

  test('Escape clears the search field and the filter in the address', async ({ page }) => {
    await page.goto('/components')
    const search = page.getByRole('searchbox', { name: 'Search components' })
    await search.fill('modal')
    await expect(page).toHaveURL(/\/components\?q=modal$/)

    await page.keyboard.press('Escape')
    await expect(search).toHaveValue('')
    await expect(page).toHaveURL(/\/components$/)
    await expect(search).toBeFocused()
  })

  test('sorts by category, keeps every entry, and goes back to name order', async ({ page }) => {
    await page.goto('/components')
    const headings = page
      .getByRole('list', { name: 'Components results' })
      .getByRole('heading', { level: 2 })
    const byName = await headings.allTextContents()
    expect(byName.length).toBeGreaterThan(5)

    await page.getByLabel('Sort by').selectOption('category')
    await expect(page).toHaveURL(/\/components\?sort=category$/)
    await expect.poll(() => headings.allTextContents()).not.toEqual(byName)
    expect([...(await headings.allTextContents())].sort()).toEqual([...byName].sort())

    await page.getByLabel('Sort by').selectOption('name')
    await expect(page).toHaveURL(/\/components$/)
    await expect.poll(() => headings.allTextContents()).toEqual(byName)
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

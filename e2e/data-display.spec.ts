import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

const mobile = { width: 360, height: 740 }
const desktop = { width: 1440, height: 900 }

/** One example on a detail page: a region named by the example's heading. */
function example(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true })
}

function rowHeaders(scope: ReturnType<typeof example>) {
  return scope.getByRole('rowheader').allTextContents()
}

test.describe('data table', () => {
  test('sorts and pages with the keyboard only', async ({ page }) => {
    await page.goto('/blocks/data-table')
    const demo = example(page, 'Sorting and pagination')
    const header = demo.getByRole('columnheader', { name: 'Service' })

    await demo.getByRole('button', { name: 'Service' }).focus()
    await page.keyboard.press('Enter')
    await expect(header).toHaveAttribute('aria-sort', 'ascending')
    expect((await rowHeaders(demo))[0]).toBe('admin')

    await page.keyboard.press('Space')
    await expect(header).toHaveAttribute('aria-sort', 'descending')
    expect((await rowHeaders(demo))[0]).toBe('web')

    const next = demo.getByRole('button', { name: 'Next page' })
    await next.focus()
    await page.keyboard.press('Enter')
    await expect(demo.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await page.keyboard.press('Enter')
    await expect(demo.getByText('11–12 of 12 deployments')).toBeVisible()
    // Next is now at its end but keeps focus.
    await expect(next).toHaveAttribute('aria-disabled', 'true')
    await expect(next).toBeFocused()
  })

  test('sorts with the pointer: ascending, descending, then no sort', async ({ page }) => {
    await page.goto('/blocks/data-table')
    const demo = example(page, 'Sorting and pagination')
    const service = demo.getByRole('columnheader', { name: 'Service' })
    const sorted = demo.locator('th[aria-sort]')
    const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })

    // The demo opens sorted by when the deployment finished, newest first.
    await expect(demo.getByRole('columnheader', { name: 'Finished (UTC)' })).toHaveAttribute(
      'aria-sort',
      'descending',
    )
    const opening = await rowHeaders(demo)

    await demo.getByRole('button', { name: 'Service' }).click()
    await expect(service).toHaveAttribute('aria-sort', 'ascending')
    await expect(sorted).toHaveCount(1)
    const ascending = await rowHeaders(demo)
    expect(ascending[0]).toBe('admin')
    expect(ascending).toEqual([...ascending].sort(collator.compare))

    await demo.getByRole('button', { name: 'Service' }).click()
    await expect(service).toHaveAttribute('aria-sort', 'descending')
    const descending = await rowHeaders(demo)
    expect(descending[0]).toBe('web')
    expect(descending).toEqual([...descending].sort((a, b) => collator.compare(b, a)))

    // The third click takes the sort away: no column claims one, and the rows are in data order.
    await demo.getByRole('button', { name: 'Service' }).click()
    await expect(sorted).toHaveCount(0)
    const unsorted = await rowHeaders(demo)
    expect(unsorted).not.toEqual(descending)
    expect(unsorted).not.toEqual(opening)
  })

  test('pages with the pointer, and a new page size starts again at page 1', async ({ page }) => {
    await page.goto('/blocks/data-table')
    const demo = example(page, 'Sorting and pagination')
    await expect(demo.getByText('1–5 of 12 deployments')).toBeVisible()

    await demo.getByRole('button', { name: 'Page 3' }).click()
    await expect(demo.getByText('11–12 of 12 deployments')).toBeVisible()
    await expect(demo.getByRole('button', { name: 'Page 3' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(await rowHeaders(demo)).toHaveLength(2)

    await demo.getByRole('button', { name: 'Previous page' }).click()
    await expect(demo.getByText('6–10 of 12 deployments')).toBeVisible()
    await expect(demo.getByRole('button', { name: 'Page 2' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // Opened and chosen with the pointer: the keyboard path is covered above.
    await demo.getByRole('combobox', { name: 'Rows per page' }).click()
    await page.getByRole('option', { name: '10', exact: true }).click()
    await expect(demo.getByText('1–10 of 12 deployments')).toBeVisible()
    expect(await rowHeaders(demo)).toHaveLength(10)
    await expect(demo.getByRole('button', { name: 'Page 1' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(demo.getByRole('button', { name: 'Page 3' })).toHaveCount(0)
  })

  test('selects rows with Space and confirms a bulk action', async ({ page }) => {
    await page.goto('/blocks/data-table')
    const demo = example(page, 'Selection and bulk action')

    await demo.getByRole('checkbox', { name: 'Select all rows on this page' }).focus()
    await page.keyboard.press('Space')
    await expect(demo.getByText('5 selected', { exact: true })).toBeVisible()

    await demo.getByRole('button', { name: 'Archive…' }).click()
    const dialog = page.getByRole('dialog', { name: 'Archive 5 deployments?' })
    await dialog.getByRole('button', { name: 'Archive' }).click()
    await expect(dialog).toBeHidden()
    await expect(demo.getByText('1–5 of 7 deployments')).toBeVisible()
  })

  test('scrolls inside a focusable region on a narrow screen', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/blocks/orders-dashboard')
    // The scroll container around the first dashboard's table.
    const region = example(page, 'Dashboard')
      .getByRole('table', { name: 'Orders' })
      .locator('xpath=..')
    await expect(region).toHaveAttribute('role', 'region')
    await expect(region).toHaveAttribute('tabindex', '0')
    await region.focus()
    await page.keyboard.press('ArrowRight')
    await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0)
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
    ).toBeLessThanOrEqual(0)
  })
})

test.describe('orders dashboard', () => {
  test('filters, then ships an order from a keyboard-selected row', async ({ page }) => {
    await page.goto('/blocks/orders-dashboard')
    const demo = example(page, 'Dashboard')

    // Accent-insensitive: "zoe" finds Zoë Müller.
    await demo.getByRole('searchbox', { name: 'Search orders' }).fill('zoe')
    const status = demo.getByRole('combobox', { name: 'Status' })
    await status.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('option', { name: 'Pending' }).click()
    await expect(demo.getByRole('status')).toHaveText('1 order')

    const first = demo.getByRole('checkbox', { name: /^Select order #/ }).first()
    await first.focus()
    await page.keyboard.press('Space')
    await demo.getByRole('button', { name: 'Mark 1 as shipped' }).click()
    // The order is no longer pending, so the filtered table is empty.
    await expect(demo.getByRole('heading', { name: 'No orders match these filters' })).toBeVisible()
    await expect(
      demo.getByRole('list', { name: 'Recent activity' }).getByRole('listitem').first(),
    ).toContainText('You marked as shipped order #1058')
  })

  test('opens details inline on a wide screen', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/blocks/orders-dashboard')
    const demo = example(page, 'Dashboard')
    const open = demo.getByRole('button', { name: '#1064', exact: true })

    await open.click()
    const panel = demo.getByRole('complementary', { name: 'Order #1064' })
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Order #1064' })).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(panel).toBeHidden()
    await expect(open).toBeFocused()
  })

  test('opens details as a modal sheet on a narrow screen', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/blocks/orders-dashboard')
    const demo = example(page, 'Dashboard')
    const open = demo.getByRole('button', { name: '#1064', exact: true })

    await open.click()
    const dialog = page.getByRole('dialog', { name: 'Order #1064' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Ana Souza')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(open).toBeFocused()
  })
})

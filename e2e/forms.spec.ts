import { expect, test, type Page } from '@playwright/test'

/** One example on a detail page: a region named by the example's heading. */
function example(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true })
}

test.describe('Profile form', () => {
  test('focuses the first error, shows a server field error, then saves from the keyboard', async ({
    page,
  }) => {
    await page.goto('/blocks/profile-form')
    const demo = example(page, 'Edit and save')
    const displayName = demo.getByRole('textbox', { name: 'Display name' })
    const password = demo.getByLabel('Current password')

    await displayName.fill('')
    await demo.getByRole('button', { name: 'Save profile' }).click()
    await expect(displayName).toBeFocused()
    await expect(displayName).toHaveAttribute('aria-invalid', 'true')
    await expect(displayName).toHaveAccessibleDescription('Enter at least 2 characters.')
    await expect(password).toHaveAttribute('aria-invalid', 'true')

    await displayName.fill('Alex Nguyen')
    await expect(displayName).not.toHaveAttribute('aria-invalid')

    await demo.getByRole('radio', { name: 'Username taken' }).check()
    await password.fill('correct horse')
    await password.press('Enter')
    await expect(demo.getByRole('alert')).toContainText('Some details need your attention.')
    const username = demo.getByRole('textbox', { name: 'Username' })
    await expect(username).toBeFocused()
    await expect(username).toHaveAccessibleDescription(/is already taken/)

    await demo.getByRole('radio', { name: 'Saves' }).check()
    await password.press('Enter')
    await expect(demo.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    const status = demo.getByRole('status')
    await expect(status).toContainText('Saved changes for @alex_ng.')
    await expect(status).toBeFocused()
  })

  test('the locked example cannot be edited', async ({ page }) => {
    await page.goto('/blocks/profile-form')
    const demo = example(page, 'Locked')
    await expect(demo.getByRole('textbox', { name: 'Display name' })).toBeDisabled()
    await expect(demo.getByRole('button', { name: 'Save profile' })).toBeDisabled()
  })
})

test.describe('Search and filter form', () => {
  test('validates the date range, then lists matching sample orders', async ({ page }) => {
    await page.goto('/blocks/search-filter-form')
    const demo = example(page, 'Filter orders')
    const updatedFrom = demo.getByLabel('Updated from')
    const updatedTo = demo.getByLabel('Updated to')

    await updatedFrom.fill('2026-10-01')
    await updatedTo.fill('2026-09-01')
    await demo.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(updatedTo).toBeFocused()
    await expect(updatedTo).toHaveAccessibleDescription(
      'The end date must be on or after the start date.',
    )

    await updatedTo.fill('')
    await demo.getByRole('searchbox', { name: 'Search orders' }).fill('linh')
    await demo.getByRole('button', { name: 'Search', exact: true }).click()

    await expect(demo.getByRole('status')).toHaveText('1 order matches.')
    await expect(
      demo.getByRole('list', { name: 'Matching orders' }).getByRole('listitem'),
    ).toHaveCount(1)
  })
})

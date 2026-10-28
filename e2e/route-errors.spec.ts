import { expect, test } from './fixtures'

// A deployment replaces the hashed files under /assets/. A tab that was open before it still asks
// for the old ones when the visitor follows a link, and the host answers 404. These tests make that
// request fail, in the production build, because the router, the lazy pages, and the error page
// all take part.

test.describe('a lazy page whose script cannot be loaded', () => {
  test('says something went wrong and keeps the site around it', async ({ page }) => {
    await page.goto('/')
    await page.route('**/assets/about-page-*.js', (route) => route.abort('failed'))
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'About' })
      .click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reload page' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible()
    await expect(page.getByRole('banner')).toBeVisible()
  })

  test('does the same for a documentation page, which has a loader of its own', async ({
    page,
  }) => {
    await page.goto('/')
    await page.route('**/assets/docs-route-page-*.js', (route) => route.abort('failed'))
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Docs' }).click()

    await expect(
      page.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()
    // Errors inside the docs layout keep the sidebar.
    await expect(page.getByRole('navigation', { name: 'Registry' })).toBeVisible()
  })

  test('lets the visitor go on to a page that does load', async ({ page }) => {
    await page.goto('/')
    await page.route('**/assets/about-page-*.js', (route) => route.abort('failed'))
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'About' })
      .click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Something went wrong' }),
    ).toBeVisible()

    await page.getByRole('link', { name: 'Back to home' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Something went wrong' })).toBeHidden()
  })
})

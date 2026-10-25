import { expect, test } from './fixtures'

// A followed link unmounts with the page it was on, which used to leave focus on the document. These
// run in the production build, because the router, the lazy pages, and the dialog that returns
// focus on close all take part.

const heading = 'main h1'

test.describe('focus after a route change', () => {
  test('a followed link moves focus to the new page heading', async ({ page }) => {
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Components' })
      .click()
    await expect(page).toHaveURL(/\/components$/)
    await expect(page.locator(heading)).toHaveText('Components')
    await expect(page.locator(heading)).toBeFocused()
  })

  test('the keyboard reaches a lazy page and lands on its heading', async ({ page }) => {
    await page.goto('/components')
    await page.getByRole('link', { name: 'Button', exact: true }).first().focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/components\/button$/)
    await expect(page.locator(heading)).toHaveText('Button')
    await expect(page.locator(heading)).toBeFocused()
  })

  test('Back puts focus on the heading of the page it returns to', async ({ page }) => {
    await page.goto('/components')
    await page.getByRole('link', { name: 'Button', exact: true }).first().click()
    await expect(page.locator(heading)).toHaveText('Button')
    await page.goBack()
    await expect(page).toHaveURL(/\/components$/)
    await expect(page.locator(heading)).toBeFocused()
  })

  test('the first Tab on a fresh load still reaches the skip link', async ({ page }) => {
    await page.goto('/components')
    await expect(page.locator(heading)).not.toBeFocused()
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  })

  test('typing in the catalog filter keeps focus in it', async ({ page }) => {
    await page.goto('/components')
    const search = page.getByRole('searchbox')
    await search.click()
    await page.keyboard.type('butt')
    await expect(page).toHaveURL(/[?&]q=butt\b/)
    await expect(search).toBeFocused()
    await expect(page.locator(heading)).not.toBeFocused()
  })

  test('a page chosen in the search menu gets focus on its heading', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('troubleshooting')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/docs\/troubleshooting$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.locator(heading)).toBeFocused()
  })

  test('a link to a fragment on another page leaves focus to the reader', async ({ page }) => {
    await page.goto('/components/button')
    await page.getByRole('link', { name: 'cn helper' }).first().click()
    await expect(page).toHaveURL(/\/docs\/installation#cn$/)
    await expect(page.locator(heading)).not.toBeFocused()
  })
})

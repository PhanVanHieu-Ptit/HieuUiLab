import { expect, test } from './fixtures'

test.describe('engineering notes', () => {
  test('filters by a tag with the keyboard, keeps it in the URL, and Back undoes it', async ({
    page,
  }) => {
    await page.goto('/notes')
    const articles = page.getByRole('list', { name: 'Articles' })
    // The page is a lazy chunk, and count() does not wait for it.
    await expect(articles.getByRole('heading', { level: 2 }).first()).toBeVisible()
    const total = await articles.getByRole('heading', { level: 2 }).count()
    expect(total).toBeGreaterThan(1)

    const react = page.getByRole('button', { name: /^react \(\d+\)$/ })
    await expect(react).toHaveAttribute('aria-pressed', 'false')
    await react.focus()
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/notes\?tag=react$/)
    await expect(react).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('status')).toContainText('tagged react')
    const filtered = await articles.getByRole('heading', { level: 2 }).count()
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(total)

    await page.goBack()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(react).toHaveAttribute('aria-pressed', 'false')
    await expect(articles.getByRole('heading', { level: 2 })).toHaveCount(total)

    await page.goForward()
    await expect(page).toHaveURL(/\/notes\?tag=react$/)
    await page.getByRole('button', { name: 'Show all articles' }).click()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(articles.getByRole('heading', { level: 2 })).toHaveCount(total)
  })

  test('opens an article from its card, and a tag on the article leads back to the list', async ({
    page,
  }) => {
    await page.goto('/notes')
    await page
      .getByRole('list', { name: 'Articles' })
      .getByRole('link', { name: 'Switching themes without a first-paint flash' })
      .click()
    await expect(page).toHaveURL(/\/notes\/theme-without-flash$/)
    await expect(page).toHaveTitle('Switching themes without a first-paint flash · Hieu UI Lab')

    await page.getByRole('link', { name: 'Articles tagged theming' }).click()
    await expect(page).toHaveURL(/\/notes\?tag=theming$/)
    await expect(page.getByRole('button', { name: /^theming \(\d+\)$/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('follows a related article', async ({ page }) => {
    await page.goto('/notes/theme-without-flash')
    const related = page.getByRole('region', { name: 'Related articles' })
    await expect(related).toBeVisible()
    await related.getByRole('link', { name: 'Respecting reduced motion beyond CSS' }).click()
    await expect(page).toHaveURL(/\/notes\/reduced-motion-beyond-css$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Respecting reduced motion beyond CSS' }),
    ).toBeVisible()
  })

  test('scrolls to a section named in the URL when the article is opened directly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/notes/theme-without-flash#verification')
    await expect(page.getByRole('heading', { level: 2, name: 'Verification' })).toBeInViewport()
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  })

  test('shows the template sections, the evidence, and an external reference', async ({ page }) => {
    await page.goto('/notes/designing-reusable-component-apis')
    const main = page.getByRole('main')
    for (const section of [
      'Context and problem',
      'Constraints',
      'Approach and alternatives considered',
      'Implementation example',
      'Verification',
      'Trade-offs and lessons learned',
      'References',
      'Evidence in the repository',
      'Related articles',
    ]) {
      await expect(main.getByRole('heading', { level: 2, name: section })).toBeVisible()
    }
    await expect(
      main.getByRole('heading', { level: 3, name: 'What this does not verify' }),
    ).toBeVisible()
    const external = main.locator('a[href^="https://"]').first()
    await expect(external).toHaveAttribute('href', /^https:\/\//)
    await expect(external).toHaveAttribute('target', '_blank')
  })
})

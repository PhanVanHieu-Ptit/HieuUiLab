import { expect, skipWithoutWebgl, test } from './fixtures'

test('navigates from home to the Button page and switches a demo to code', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.getByRole('link', { name: 'Explore Components' }).click()
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

test('navigates from the landing page to a case study through View Projects', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Build. Learn. Share.' })).toBeVisible()

  await page.getByRole('link', { name: 'View Projects' }).click()
  await expect(page).toHaveURL(/\/projects$/)
  await page.getByRole('link', { name: 'Registry-driven documentation' }).click()

  await expect(page).toHaveURL(/\/projects\/registry-driven-documentation$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Registry-driven documentation' }),
  ).toBeVisible()
})

test('landing previews are interactive in place', async ({ page }) => {
  await page.goto('/')
  const preview = page.getByRole('group', { name: 'Tabs live preview' })
  await preview.getByRole('tab', { name: 'Activity' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(preview.getByRole('tab', { name: 'Activity' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
})

test('switches and persists the dark theme from the theme menu', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/components/button')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole('button', { name: 'Theme: System' }).click()
  await page.getByRole('menuitemradio', { name: 'Dark' }).click()
  await expect(html).toHaveClass(/dark/)

  await page.reload()
  await expect(html).toHaveClass(/dark/)
  await expect(page.getByRole('button', { name: 'Theme: Dark' })).toBeVisible()
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

test('the WebGL scene starts still under reduced motion and plays on request', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/labs/3d/webgl-scene')
  const paused = page.getByText('Paused because your system asks for reduced motion.')
  const unavailable = page.getByRole('heading', { name: 'WebGL is unavailable' })
  await expect(paused.or(unavailable)).toBeVisible()
  // Skips on a machine without WebGL; on CI that is a failure, not a pass through the other branch.
  await skipWithoutWebgl(unavailable, 'This browser has no WebGL, so the scene cannot run.')

  await page.getByRole('button', { name: 'Play rotation' }).click()
  await expect(page.getByRole('button', { name: 'Pause rotation' })).toBeVisible()
})

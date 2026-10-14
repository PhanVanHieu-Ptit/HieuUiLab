import { expect, test } from '@playwright/test'

// Direct loads and refreshes of every required URL against the production build,
// so nested paths, lazy chunks, and titles work without client-side navigation first.
const routes: readonly [path: string, h1: string | RegExp, title: string][] = [
  ['/', 'Build. Learn. Share.', 'Hieu UI Lab'],
  ['/components', 'Components', 'Components · Hieu UI Lab'],
  ['/components/button', 'Button', 'Button · Hieu UI Lab'],
  ['/blocks', 'Blocks', 'Blocks · Hieu UI Lab'],
  ['/blocks/resource-list', 'Resource list', 'Resource list · Hieu UI Lab'],
  ['/templates', 'Templates', 'Templates · Hieu UI Lab'],
  ['/playground', 'Playground', 'Playground · Hieu UI Lab'],
  ['/labs', 'Geospatial and 3D experiments', 'Labs · Hieu UI Lab'],
  ['/labs/maps', 'Maps', 'Maps · Hieu UI Lab'],
  ['/labs/3d', '3D', '3D · Hieu UI Lab'],
  ['/docs', 'Introduction', 'Docs · Hieu UI Lab'],
  ['/docs/installation', 'Installation', 'Installation · Hieu UI Lab'],
  ['/docs/architecture', 'Architecture', 'Architecture · Hieu UI Lab'],
  ['/notes', 'Technical notes', 'Notes · Hieu UI Lab'],
  ['/notes/theme-without-flash', /.+/, ' · Hieu UI Lab'],
  ['/projects', 'Engineering case studies', 'Projects · Hieu UI Lab'],
  [
    '/projects/contrast-tested-design-system',
    'A contrast-tested design system',
    'A contrast-tested design system · Hieu UI Lab',
  ],
  ['/about', 'About the lab', 'About · Hieu UI Lab'],
]

test('every required URL loads directly and survives a refresh', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  for (const [path, h1, title] of routes) {
    for (const load of ['goto', 'reload'] as const) {
      if (load === 'goto') await page.goto(path)
      else await page.reload()
      await expect(page, `${path} (${load})`).toHaveURL(new RegExp(`${path}$`))
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1)
      await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0)
      await expect(page).toHaveTitle(title.startsWith(' ') ? new RegExp(`.+${title}$`) : title)
    }
  }
  expect(errors).toEqual([])
})

test('back and forward restore the page, title, and scroll position', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Labs' }).click()
  await expect(page).toHaveURL(/\/labs$/)

  await page.getByRole('link', { name: 'All 3D experiments' }).click()
  await expect(page).toHaveURL(/\/labs\/3d$/)
  await page.getByRole('link', { name: 'WebGL scene with motion controls' }).click()
  await expect(page).toHaveURL(/\/labs\/3d\/webgl-scene$/)
  await expect(page).toHaveTitle('WebGL scene with motion controls · Hieu UI Lab')

  await page.goBack()
  await expect(page).toHaveURL(/\/labs\/3d$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('3D')
  await expect(page).toHaveTitle('3D · Hieu UI Lab')

  await page.goBack()
  await expect(page).toHaveURL(/\/labs$/)
  await page.evaluate(() => {
    window.scrollTo(0, 400)
  })
  await page.waitForFunction(() => window.scrollY === 400)
  await page.getByRole('link', { name: 'All 3D experiments' }).click()
  await expect(page).toHaveURL(/\/labs\/3d$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)

  await page.goBack()
  await expect(page).toHaveURL(/\/labs$/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(400)

  await page.goForward()
  await expect(page).toHaveURL(/\/labs\/3d$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('3D')
})

test.describe('invalid URLs', () => {
  for (const [path, section] of [
    ['/components/nope', 'Components'],
    ['/notes/nope', 'Notes'],
    ['/labs/maps/nope', 'Maps'],
  ] as const) {
    test(`${path} offers a way back to ${section}`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
      await expect(page).toHaveTitle('Page not found · Hieu UI Lab')
      await page.getByRole('link', { name: `Browse ${section}` }).click()
      await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }

  test('an unknown top-level URL shows the not-found page', async ({ page }) => {
    await page.goto('/does/not/exist')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })

  test('a legacy lab URL redirects without trapping Back', async ({ page }) => {
    await page.goto('/')
    await page.goto('/lab/webgl-scene')
    await expect(page).toHaveURL(/\/labs\/3d\/webgl-scene$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
  })
})

test.describe('mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
  })

  test('the drawer lists every section and marks planned ones', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    for (const name of ['Installation', 'Architecture', 'All experiments', 'Maps', '3D', 'About']) {
      await expect(drawer.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await expect(drawer.getByRole('link', { name: 'Templates Planned' })).toBeVisible()
    await expect(drawer.getByRole('link', { name: 'Playground Planned' })).toBeVisible()
  })

  test('navigates to a nested route, closes, and marks it active', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await drawer.getByRole('link', { name: 'Maps', exact: true }).click()

    await expect(page).toHaveURL(/\/labs\/maps$/)
    await expect(drawer).toBeHidden()
    await expect(page.getByRole('heading', { level: 1, name: 'Maps' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link')).toHaveText(
      ['Home', 'Labs'],
    )

    await page.getByRole('link', { name: 'Map projection explorer' }).click()
    await expect(page).toHaveURL(/\/labs\/maps\/map-projections$/)
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await expect(
      page.getByRole('dialog').getByRole('link', { name: 'Maps', exact: true }),
    ).toHaveAttribute('aria-current', 'page')
  })

  test('back and forward work after drawer navigation', async ({ page }) => {
    await page.goto('/notes')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    await page.getByRole('dialog').getByRole('link', { name: 'About', exact: true }).click()
    await expect(page).toHaveURL(/\/about$/)
    await page.goBack()
    await expect(page).toHaveURL(/\/notes$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Technical notes')
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About the lab')
  })
})

import { expect, test } from './fixtures'

// Direct loads and refreshes of every required URL against the production build,
// so nested paths, lazy chunks, and titles work without client-side navigation first.
const routes: readonly [path: string, h1: string | RegExp, title: string][] = [
  ['/', 'Build. Learn. Share.', 'Hieu UI Lab'],
  ['/components', 'Components', 'Components · Hieu UI Lab'],
  ['/components/button', 'Button', 'Button · Hieu UI Lab'],
  ['/blocks', 'Blocks', 'Blocks · Hieu UI Lab'],
  ['/blocks/resource-list', 'Resource list', 'Resource list · Hieu UI Lab'],
  ['/blocks/sign-in-page', 'Sign-in page', 'Sign-in page · Hieu UI Lab'],
  ['/blocks/monitoring-dashboard', 'Monitoring dashboard', 'Monitoring dashboard · Hieu UI Lab'],
  ['/components/tooltip', 'Tooltip', 'Tooltip · Hieu UI Lab'],
  ['/templates', 'Templates', 'Templates · Hieu UI Lab'],
  ['/templates/admin-dashboard', 'Admin dashboard', 'Admin dashboard · Hieu UI Lab'],
  [
    '/templates/operations-monitoring',
    'Operations monitoring',
    'Operations monitoring · Hieu UI Lab',
  ],
  [
    '/templates/data-management-workspace',
    'Data management workspace',
    'Data management workspace · Hieu UI Lab',
  ],
  ['/playground', 'Playground', 'Playground · Hieu UI Lab'],
  ['/labs', 'Geospatial and 3D experiments', 'Labs · Hieu UI Lab'],
  ['/labs/maps', 'Maps', 'Maps · Hieu UI Lab'],
  [
    '/labs/maps/maplibre-viewer',
    'Interactive map viewer with MapLibre',
    'Interactive map viewer with MapLibre · Hieu UI Lab',
  ],
  ['/labs/3d', '3D', '3D · Hieu UI Lab'],
  [
    '/labs/3d/three-scene',
    'Three.js scene with orbit controls',
    'Three.js scene with orbit controls · Hieu UI Lab',
  ],
  ['/docs', 'Getting started', 'Getting started · Hieu UI Lab'],
  ['/docs/installation', 'Installation', 'Installation · Hieu UI Lab'],
  ['/docs/project-structure', 'Project structure', 'Project structure · Hieu UI Lab'],
  ['/docs/theming', 'Theme customization', 'Theme customization · Hieu UI Lab'],
  [
    '/docs/component-conventions/adding-a-component',
    'Adding a component',
    'Adding a component · Hieu UI Lab',
  ],
  ['/docs/changelog', 'Changelog', 'Changelog · Hieu UI Lab'],
  ['/notes', 'Engineering notes', 'Notes · Hieu UI Lab'],
  [
    '/notes/theme-without-flash',
    'Switching themes without a first-paint flash',
    'Switching themes without a first-paint flash · Hieu UI Lab',
  ],
  [
    '/notes/reduced-motion-beyond-css',
    'Respecting reduced motion beyond CSS',
    'Respecting reduced motion beyond CSS · Hieu UI Lab',
  ],
  [
    '/notes/contrast-checks-as-unit-tests',
    'Checking colour contrast in a unit test',
    'Checking colour contrast in a unit test · Hieu UI Lab',
  ],
  [
    '/notes/whole-card-links',
    'Whole-card links without nesting everything in an anchor',
    'Whole-card links without nesting everything in an anchor · Hieu UI Lab',
  ],
  [
    '/notes/designing-reusable-component-apis',
    'Designing reusable React component APIs',
    'Designing reusable React component APIs · Hieu UI Lab',
  ],
  [
    '/notes/strict-typescript-for-a-component-library',
    'Strict TypeScript for a component library',
    'Strict TypeScript for a component library · Hieu UI Lab',
  ],
  [
    '/notes/react-hook-form-and-zod-in-a-form-library',
    'React Hook Form and Zod in a component library',
    'React Hook Form and Zod in a component library · Hieu UI Lab',
  ],
  [
    '/notes/registry-validation-as-a-distribution-workflow',
    'Registry validation as a distribution workflow',
    'Registry validation as a distribution workflow · Hieu UI Lab',
  ],
  ['/projects', 'Projects and case studies', 'Projects · Hieu UI Lab'],
  [
    '/projects/hieu-ui-lab-platform',
    'Hieu UI Lab: a documentation site built on one typed registry',
    'Hieu UI Lab: a documentation site built on one typed registry · Hieu UI Lab',
  ],
  [
    '/projects/hieu-ui-lab-component-library',
    'Hieu UI Lab component library and design system',
    'Hieu UI Lab component library and design system · Hieu UI Lab',
  ],
  [
    '/projects/geospatial-3d-experiments',
    'Map projections and a WebGL scene, written from first principles',
    'Map projections and a WebGL scene, written from first principles · Hieu UI Lab',
  ],
  [
    '/projects/contrast-tested-design-system',
    'A contrast-tested design system',
    'A contrast-tested design system · Hieu UI Lab',
  ],
  ['/about', 'About Hieu', 'About · Hieu UI Lab'],
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
    ['/templates/nope', 'Templates'],
    ['/projects/nope', 'Projects'],
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

  test('the drawer lists every section, the templates, and marks planned ones', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    for (const name of [
      'Installation',
      'Project structure',
      'Adding a component',
      'All experiments',
      'Maps',
      '3D',
      'About',
    ]) {
      await expect(drawer.getByRole('link', { name, exact: true })).toBeVisible()
    }
    for (const name of [
      'All templates',
      'Admin dashboard Experimental',
      'Operations monitoring Experimental',
      'Data management workspace Experimental',
    ]) {
      await expect(drawer.getByRole('link', { name, exact: true })).toBeVisible()
    }
    await expect(drawer.getByRole('link', { name: 'Combobox Planned' })).toBeVisible()
    // Built, so it carries no "Planned" label.
    await expect(drawer.getByRole('link', { name: 'Playground', exact: true })).toBeVisible()
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Engineering notes')
    await page.goForward()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('About Hieu')
  })
})

test.describe('registry catalog', () => {
  test('filters from the URL and from the controls, and Back restores the filter', async ({
    page,
  }) => {
    await page.goto('/components?tag=modal')
    const results = page.getByRole('list', { name: 'Components results' })
    await expect(results.getByRole('heading', { level: 2 })).toHaveCount(2)

    await page.getByRole('combobox', { name: 'Category' }).selectOption('overlays')
    await expect(page).toHaveURL(/\?category=overlays&tag=modal$/)

    await page.getByRole('button', { name: 'modal', pressed: true }).click()
    await expect(page).toHaveURL(/\?category=overlays$/)
    await expect(results.getByRole('link', { name: 'Tooltip' })).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(/\?category=overlays&tag=modal$/)
    await expect(results.getByRole('link', { name: 'Tooltip' })).toHaveCount(0)
  })

  test('a planned entry has no source or install steps and is not indexed', async ({ page }) => {
    await page.goto('/components/combobox')
    await expect(page.getByRole('heading', { name: 'Not implemented yet' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Installation' })).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  })

  test('a mistyped slug suggests the closest entry', async ({ page }) => {
    await page.goto('/components/buton')
    await page
      .getByRole('navigation', { name: 'Suggestions' })
      .getByRole('link', { name: 'Button' })
      .click()
    await expect(page).toHaveURL(/\/components\/button$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Button')
  })
})

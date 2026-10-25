import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

const viewports = [
  { name: 'mobile', width: 360, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const

const routes = [
  '/',
  '/docs',
  '/docs/theming',
  '/components',
  '/components/alert',
  '/components/badge',
  '/components/button',
  '/components/checkbox',
  '/components/dialog',
  '/components/input',
  '/components/label',
  '/components/pagination',
  '/components/select',
  '/components/skeleton',
  '/components/switch',
  '/components/table',
  '/components/tabs',
  '/components/tooltip',
  '/blocks',
  '/blocks/crud-management-page',
  '/blocks/dashboard-overview',
  '/blocks/data-table',
  '/blocks/detail-panel',
  '/blocks/monitoring-dashboard',
  '/blocks/multi-step-onboarding',
  '/blocks/notification-center',
  '/blocks/orders-dashboard',
  '/blocks/resource-list',
  '/blocks/search-filter-toolbar',
  '/blocks/sign-in-page',
  '/blocks/user-profile-settings',
  '/docs/installation',
  '/docs/project-structure',
  '/templates',
  '/templates/admin-dashboard',
  '/templates/operations-monitoring',
  '/templates/data-management-workspace',
  '/playground',
  '/labs',
  '/labs/maps',
  '/labs/3d',
  '/labs/maps/map-projections',
  '/labs/maps/maplibre-viewer',
  '/labs/3d/webgl-scene',
  '/labs/3d/three-scene',
  '/projects',
  '/projects/contrast-tested-design-system',
  '/projects/hieu-ui-lab-platform',
  '/projects/hieu-ui-lab-component-library',
  '/projects/geospatial-3d-experiments',
  '/notes',
  '/notes/theme-without-flash',
  '/notes/reduced-motion-beyond-css',
  '/notes/contrast-checks-as-unit-tests',
  '/notes/whole-card-links',
  '/notes/designing-reusable-component-apis',
  '/notes/strict-typescript-for-a-component-library',
  '/notes/react-hook-form-and-zod-in-a-form-library',
  '/notes/registry-validation-as-a-distribution-workflow',
  '/about',
]
const themes = ['light', 'dark'] as const

// Set SCREENSHOT_DIR to save full-page captures for manual visual review.
const screenshotDir = process.env.SCREENSHOT_DIR

async function useTheme(page: Page, theme: (typeof themes)[number]) {
  await page.addInitScript((value) => {
    localStorage.setItem('hieu-ui-lab:theme', value)
  }, theme)
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('responsive layout', () => {
  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`${viewport.name} ${theme}: no horizontal overflow`, async ({ page }) => {
        // Every documented route is loaded in turn, so the default 30 seconds is not enough.
        test.setTimeout(180_000)
        await page.setViewportSize(viewport)
        await useTheme(page, theme)
        for (const route of routes) {
          await page.goto(route)
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
          // Wait for lazy Shiki highlighting so long code lines are measured too.
          await page.waitForLoadState('networkidle')
          expect(await horizontalOverflow(page), `overflow on ${route}`).toBeLessThanOrEqual(0)
          if (screenshotDir) {
            const slug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-')
            await page.screenshot({
              path: `${screenshotDir}/${viewport.name}-${theme}-${slug}.png`,
              fullPage: true,
            })
          }
        }
      })
    }
  }

  test('the header fits at every width, and shows only the links that fit', async ({ page }) => {
    // Templates joins the bar from `lg` and About from `xl`; below `md` the drawer holds them all.
    const widths = [
      { width: 768, templates: false, about: false },
      { width: 900, templates: false, about: false },
      { width: 1024, templates: true, about: false },
      { width: 1100, templates: true, about: false },
      { width: 1279, templates: true, about: false },
      { width: 1280, templates: true, about: true },
      { width: 1440, templates: true, about: true },
    ]
    for (const { width, templates, about } of widths) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      const nav = page.getByRole('navigation', { name: 'Main' })
      await expect(nav.getByRole('link', { name: 'Components' })).toBeVisible()
      await expect(
        nav.getByRole('link', { name: 'Templates' }),
        `Templates at ${String(width)}`,
      ).toBeVisible({ visible: templates })
      await expect(
        nav.getByRole('link', { name: 'About' }),
        `About at ${String(width)}`,
      ).toBeVisible({ visible: about })

      const overflow = await page.evaluate(() => {
        const bar = document.querySelector('header > div')
        return bar ? bar.scrollWidth - bar.clientWidth : -1
      })
      expect(overflow, `header overflow at ${String(width)}`).toBeLessThanOrEqual(0)
      expect(
        await horizontalOverflow(page),
        `page overflow at ${String(width)}`,
      ).toBeLessThanOrEqual(0)
    }
  })

  test('the drawer takes over from the header links exactly below 768 pixels', async ({ page }) => {
    for (const { width, drawer } of [
      { width: 767, drawer: true },
      { width: 768, drawer: false },
    ]) {
      await page.setViewportSize({ width, height: 800 })
      await page.goto('/')
      await expect(
        page.getByRole('button', { name: 'Open navigation' }),
        `the menu button at ${String(width)}`,
      ).toBeVisible({ visible: drawer })
      await expect(
        page.getByRole('navigation', { name: 'Main' }),
        `the header links at ${String(width)}`,
      ).toBeVisible({ visible: !drawer })
    }
  })

  test('mobile hides the sidebar and header nav; desktop shows them', async ({ page }) => {
    await page.setViewportSize(viewports[0])
    await page.goto('/components/button')
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Registry' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()

    await page.setViewportSize(viewports[2])
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Registry' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
  })
})

test.describe('mobile navigation drawer', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(viewports[0])
  })

  test('works with the keyboard alone', async ({ page }) => {
    await page.goto('/docs')
    await page.keyboard.press('Tab') // skip link
    await page.keyboard.press('Tab')
    const trigger = page.getByRole('button', { name: 'Open navigation' })
    await expect(trigger).toBeFocused()

    await page.keyboard.press('Enter')
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await expect(drawer).toBeVisible()
    await page.keyboard.press('Tab')
    expect(await drawer.evaluate((node) => node.contains(document.activeElement))).toBe(true)
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)

    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })

  test('Tab and Shift+Tab never leave the open drawer, however far they go', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await expect(drawer).toBeVisible()

    // Past the last stop and round again: a trap that leaks shows up at the seam.
    const stops = await drawer.locator('a[href], button:not([disabled])').count()
    expect(stops).toBeGreaterThan(10)
    const insideDrawer = () =>
      page.evaluate(() => document.activeElement?.closest('[role="dialog"]') != null)
    for (const key of ['Tab', 'Shift+Tab']) {
      for (let step = 1; step <= stops + 2; step += 1) {
        await page.keyboard.press(key)
        expect(await insideDrawer(), `${key} #${String(step)} left the drawer`).toBe(true)
      }
    }
  })

  test('works with the pointer and closes after navigating', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await drawer.getByRole('link', { name: 'Theme customization' }).click()

    await expect(page).toHaveURL(/\/docs\/theming$/)
    await expect(drawer).toBeHidden()
    await expect(page.getByRole('heading', { level: 1, name: 'Theme customization' })).toBeVisible()
  })
})

test.describe('theme', () => {
  test('system follows the OS preference live and persists', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/docs/theming')
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    await page.emulateMedia({ colorScheme: 'light' })
    await expect(html).not.toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Theme: System' }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await page.emulateMedia({ colorScheme: 'light' })
    await expect(html).toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Theme: Dark' }).click()
    await page.getByRole('menuitemradio', { name: 'System' }).click()
    await expect(html).not.toHaveClass(/dark/)
    await page.reload()
    await expect(page.getByRole('button', { name: 'Theme: System' })).toBeVisible()
  })

  test('changes the rendered colors, not just a class', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' })
    await page.goto('/components')
    const read = () =>
      page.evaluate(() => {
        const header = document.querySelector('header')
        return {
          body: getComputedStyle(document.body).backgroundColor,
          text: getComputedStyle(document.body).color,
          border: header ? getComputedStyle(header).borderBottomColor : '',
        }
      })
    const light = await read()

    await page.getByRole('button', { name: /^Theme:/ }).click()
    await page.getByRole('menuitemradio', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
    const dark = await read()

    expect(dark.body).not.toBe(light.body)
    expect(dark.text).not.toBe(light.text)
    expect(dark.border).not.toBe(light.border)
  })

  test('an explicit Light choice beats a dark system and survives a reload', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/components/button')
    const html = page.locator('html')
    await expect(html).toHaveClass(/dark/)

    await page.getByRole('button', { name: 'Theme: System' }).click()
    await page.getByRole('menuitemradio', { name: 'Light' }).click()
    await expect(html).not.toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible()

    await page.reload()
    await expect(html).not.toHaveClass(/dark/)
    await expect(page.getByRole('button', { name: 'Theme: Light' })).toBeVisible()
    expect(await page.evaluate(() => localStorage.getItem('hieu-ui-lab:theme'))).toBe('light')

    // The system changing its mind does not move a theme that was chosen.
    await page.emulateMedia({ colorScheme: 'light' })
    await page.emulateMedia({ colorScheme: 'dark' })
    await expect(html).not.toHaveClass(/dark/)
  })

  // The inline script in index.html sets the class before the first paint. With the application's
  // own scripts refused, nothing else can have set it, so a wrong class here is a flash of the
  // wrong theme for every visitor.
  for (const { saved, system, dark } of [
    { saved: 'dark', system: 'light', dark: true },
    { saved: 'light', system: 'dark', dark: false },
    { saved: 'system', system: 'dark', dark: true },
    { saved: 'system', system: 'light', dark: false },
  ] as const) {
    test(`${saved} on a ${system} system is ${dark ? 'dark' : 'light'} before any app script runs`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        localStorage.setItem('hieu-ui-lab:theme', value)
      }, saved)
      await page.emulateMedia({ colorScheme: system })
      await page.route('**/assets/**/*.js', (route) => route.abort())

      await page.goto('/components/button')

      const html = page.locator('html')
      if (dark) await expect(html).toHaveClass(/dark/)
      else await expect(html).not.toHaveClass(/dark/)
      // The application did not start, so the page is still the empty shell.
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(0)
    })
  }
})

test.describe('keyboard and focus', () => {
  test('header controls show a visible focus outline', async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto('/components')
    const expected = [
      'Hieu UI Lab',
      'Components',
      'Blocks',
      'Templates',
      'Labs',
      'Projects',
      'Notes',
      'Docs',
      'About',
      'Search docs',
      'GitHub',
      'Theme',
    ]

    await page.keyboard.press('Tab') // skip link
    for (const name of expected) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement
        const style = getComputedStyle(element)
        // Resolve the token through a probe so both colors use the browser's serialization.
        const probe = document.createElement('div')
        probe.style.color = 'var(--ring)'
        document.body.append(probe)
        const ring = getComputedStyle(probe).color
        probe.remove()
        return {
          name: element.getAttribute('aria-label') ?? element.textContent.trim(),
          outline: style.outlineStyle,
          width: Number.parseFloat(style.outlineWidth),
          isRingColor: style.outlineColor === ring,
        }
      })
      expect(focused.name).toContain(name)
      expect(focused.outline, `${name} outline`).not.toBe('none')
      expect(focused.width, `${name} outline width`).toBeGreaterThanOrEqual(2)
      expect(focused.isRingColor, `${name} outline uses the ring token`).toBe(true)
    }
  })

  test('every main nav item navigates to a page with its own heading', async ({ page }) => {
    await page.setViewportSize(viewports[2])
    for (const name of [
      'Components',
      'Blocks',
      'Templates',
      'Labs',
      'Projects',
      'Notes',
      'Docs',
      'About',
    ]) {
      await page.goto('/')
      await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name }).click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0)
    }
  })

  test('Ctrl/Cmd+K opens search; Enter navigates to the active result', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    const input = page.getByRole('combobox', { name: 'Search documentation' })
    await expect(input).toBeFocused()

    await input.fill('button')
    await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/components\/button$/)
    await expect(page.getByRole('dialog')).toBeHidden()
  })

  test('the breadcrumb trail reflects the route', async ({ page }) => {
    await page.goto('/components/tabs')
    const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(trail.getByRole('link')).toHaveText(['Home', 'Components', 'Navigation'])
    await expect(trail.locator('[aria-current="page"]')).toHaveText('Tabs')
  })
})

test.describe('mobile navigation drawer on a touch screen', () => {
  test.use({ hasTouch: true, viewport: { width: viewports[0].width, height: viewports[0].height } })

  test('opens with a tap; the Close button and a tap outside each dismiss it', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Open navigation' })
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })

    await trigger.tap()
    await expect(drawer).toBeVisible()
    await drawer.getByRole('button', { name: 'Close' }).tap()
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()

    await trigger.tap()
    await expect(drawer).toBeVisible()
    // The drawer slides in from the left. Measure it once it has stopped, or the point chosen
    // below can fall inside where it ends up.
    await expect.poll(async () => (await drawer.boundingBox())?.x).toBe(0)
    // The drawer is 85% of the screen wide; what is left of the screen is the overlay.
    const box = await drawer.boundingBox()
    expect(box, 'the open drawer has a box').not.toBeNull()
    const outsideX = (box?.x ?? 0) + (box?.width ?? 0) + 10
    expect(outsideX, 'there is overlay to the right of the drawer').toBeLessThan(viewports[0].width)
    await page.touchscreen.tap(outsideX, 400)
    await expect(drawer).toBeHidden()
    await expect(trigger).toBeFocused()
  })
})

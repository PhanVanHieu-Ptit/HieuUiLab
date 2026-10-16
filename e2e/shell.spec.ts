import { expect, test, type Page } from '@playwright/test'

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
  '/docs/architecture',
  '/templates',
  '/playground',
  '/labs',
  '/labs/maps',
  '/labs/3d',
  '/labs/maps/map-projections',
  '/labs/3d/webgl-scene',
  '/projects',
  '/projects/contrast-tested-design-system',
  '/notes',
  '/notes/theme-without-flash',
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

  test('works with the pointer and closes after navigating', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await drawer.getByRole('link', { name: 'Theming' }).click()

    await expect(page).toHaveURL(/\/docs\/theming$/)
    await expect(drawer).toBeHidden()
    await expect(page.getByRole('heading', { level: 1, name: 'Theming' })).toBeVisible()
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
})

test.describe('keyboard and focus', () => {
  test('header controls show a visible focus outline', async ({ page }) => {
    await page.setViewportSize(viewports[2])
    await page.goto('/components')
    const expected = [
      'Hieu UI Lab',
      'Components',
      'Blocks',
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
    for (const name of ['Components', 'Blocks', 'Labs', 'Projects', 'Notes', 'Docs', 'About']) {
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

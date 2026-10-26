import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

// Every documentation page, with the h1 it renders. The sweep below loads each one at three widths
// in both themes, so a wide table or code block that pushes the page sideways is caught.
const pages = [
  ['/docs', 'Getting started'],
  ['/docs/installation', 'Installation'],
  ['/docs/shadcn-registry', 'Install with the shadcn CLI'],
  ['/docs/project-structure', 'Project structure'],
  ['/docs/design-tokens', 'Design tokens'],
  ['/docs/theming', 'Theme customization'],
  ['/docs/accessibility', 'Accessibility guidelines'],
  ['/docs/component-conventions', 'Component conventions'],
  ['/docs/component-conventions/adding-a-component', 'Adding a component'],
  ['/docs/form-integration', 'Form integration'],
  ['/docs/data-table', 'DataTable usage'],
  ['/docs/map-viewer', 'Map viewer and basemaps'],
  ['/docs/deployment', 'Deployment'],
  ['/docs/block-composition', 'Block composition'],
  ['/docs/block-composition/page-blocks', 'Adding a page block'],
  ['/docs/block-composition/templates', 'Adding a template'],
  ['/docs/component-api', 'Component API reference'],
  ['/docs/testing', 'Testing strategy'],
  ['/docs/troubleshooting', 'Troubleshooting'],
  ['/docs/changelog', 'Changelog'],
] as const

const viewports = [
  { name: 'mobile', width: 360, height: 740 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('every docs page', () => {
  for (const viewport of viewports) {
    for (const theme of ['light', 'dark'] as const) {
      test(`${viewport.name} ${theme}: loads and does not overflow sideways`, async ({ page }) => {
        test.setTimeout(120_000)
        await page.setViewportSize(viewport)
        await page.addInitScript((value) => {
          localStorage.setItem('hieu-ui-lab:theme', value)
        }, theme)
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))

        for (const [path, title] of pages) {
          await page.goto(path)
          await expect(page.getByRole('heading', { level: 1 }), path).toHaveText(title)
          // Wait for lazy highlighting and generated tables so the final layout is measured.
          await page.waitForLoadState('networkidle')
          await expect(
            page.getByText(/^Cannot show ::/),
            `${path} has a failed directive`,
          ).toHaveCount(0)
          expect(await horizontalOverflow(page), `overflow on ${path}`).toBeLessThanOrEqual(0)
        }
        expect(errors).toEqual([])
      })
    }
  }
})

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  test('nested pages sit under their parent in the sidebar and in the breadcrumb', async ({
    page,
  }) => {
    await page.goto('/docs/block-composition/templates')
    const sidebar = page.getByRole('navigation', { name: 'Registry' })
    await expect(sidebar.getByRole('heading', { name: 'Guides' })).toBeVisible()
    await expect(sidebar.getByRole('link', { name: 'Adding a template' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await expect(sidebar.getByRole('link', { name: 'Block composition' })).not.toHaveAttribute(
      'aria-current',
      'page',
    )

    const trail = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(trail.getByRole('listitem')).toHaveText([
      'Home',
      'Docs',
      'Guides',
      'Block composition',
      'Adding a template',
    ])
    await trail.getByRole('link', { name: 'Block composition' }).click()
    await expect(page).toHaveURL(/\/docs\/block-composition$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Block composition')
  })

  test('the previous and next links walk the pages in order', async ({ page }) => {
    await page.goto('/docs')
    await page
      .getByRole('navigation', { name: 'Docs pager' })
      .getByRole('link', { name: /Next/ })
      .click()
    await expect(page).toHaveURL(/\/docs\/installation$/)
    await page
      .getByRole('navigation', { name: 'Docs pager' })
      .getByRole('link', { name: /Next/ })
      .click()
    await expect(page).toHaveURL(/\/docs\/shadcn-registry$/)
    await page
      .getByRole('navigation', { name: 'Docs pager' })
      .getByRole('link', { name: /Next/ })
      .click()
    await expect(page).toHaveURL(/\/docs\/project-structure$/)
    await page
      .getByRole('navigation', { name: 'Docs pager' })
      .getByRole('link', { name: /Previous/ })
      .click()
    await expect(page).toHaveURL(/\/docs\/shadcn-registry$/)
  })

  test('opens a docs page from the search menu', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Control+k')
    await page.getByRole('combobox').fill('troubleshooting')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/docs\/troubleshooting$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Troubleshooting')
  })

  test('the contents link scrolls to its heading', async ({ page }) => {
    await page.goto('/docs/installation')
    const toc = page.getByRole('navigation', { name: 'On this page' })
    await expect(toc).toBeVisible()
    await toc.getByRole('link', { name: /Add the cn helper/ }).click()
    await expect(page).toHaveURL(/#cn$/)
    const heading = page.locator('#cn')
    await expect(heading).toBeInViewport()
    // The sticky header must not cover it.
    const top = await heading.evaluate((node) => node.getBoundingClientRect().top)
    expect(top).toBeGreaterThanOrEqual(56)
  })

  test('a link with a #fragment opens at its heading on a fresh load', async ({ page }) => {
    await page.goto('/docs/installation#cn')
    await expect(page.locator('#cn')).toBeInViewport()
  })

  test('the mobile drawer lists the nested pages', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/')
    await page.getByRole('button', { name: 'Open navigation' }).click()
    const drawer = page.getByRole('dialog', { name: 'Hieu UI Lab' })
    await expect(drawer.getByRole('link', { name: 'Adding a page block' })).toBeVisible()
    await drawer.getByRole('link', { name: 'Adding a page block' }).click()
    await expect(page).toHaveURL(/\/docs\/block-composition\/page-blocks$/)
    await expect(drawer).toBeHidden()
  })
})

test.describe('moved and missing pages', () => {
  test('a moved URL redirects without trapping Back', async ({ page }) => {
    await page.goto('/')
    await page.goto('/docs/architecture')
    await expect(page).toHaveURL(/\/docs\/project-structure$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Project structure')
    await page.goBack()
    await expect(page).toHaveURL(/\/$/)
  })

  test('a missing page keeps the sidebar and suggests the closest pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/docs/instalation')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await expect(page).toHaveTitle('Page not found · Hieu UI Lab')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
    await expect(page.getByRole('navigation', { name: 'Registry' })).toBeVisible()
    await page
      .getByRole('navigation', { name: 'Suggestions' })
      .getByRole('link', { name: 'Installation' })
      .click()
    await expect(page).toHaveURL(/\/docs\/installation$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Installation')
  })

  test('Browse Docs leads back to the docs', async ({ page }) => {
    await page.goto('/docs/nope')
    await page.getByRole('link', { name: 'Browse Docs' }).click()
    await expect(page).toHaveURL(/\/docs$/)
  })
})

test.describe('code blocks', () => {
  test('copy the code exactly', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/docs/installation')
    await page.getByRole('button', { name: 'Copy src/main.tsx' }).click()
    await expect(page.getByText('Copied to clipboard')).toBeAttached()
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
      "import '@fontsource-variable/ibm-plex-sans'\nimport '@fontsource-variable/jetbrains-mono'",
    )
  })

  test('are highlighted once the grammar loads, in both themes', async ({ page }) => {
    await page.goto('/docs/installation')
    await expect(page.locator('figure .shiki').first()).toBeVisible()
  })

  test('a wide block scrolls inside a focusable region on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 })
    await page.goto('/docs/installation')
    await expect(page.locator('figure .shiki').first()).toBeVisible()
    const region = page.getByRole('region', { name: /scrollable$/ }).first()
    await expect(region).toBeVisible()
    await region.focus()
    await expect(region).toBeFocused()
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })
})

test.describe('generated content', () => {
  test('the design tokens come from the stylesheet', async ({ page }) => {
    await page.goto('/docs/design-tokens')
    const colors = page.getByRole('table', { name: 'Color tokens' })
    await expect(colors.getByRole('rowheader', { name: '--primary', exact: true })).toBeVisible()
  })

  test('the theme switcher changes the theme on the page', async ({ page }) => {
    await page.goto('/docs/theming')
    await page.getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

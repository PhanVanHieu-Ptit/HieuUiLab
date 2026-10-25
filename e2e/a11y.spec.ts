import type { Page } from '@playwright/test'

import { expectNoViolations, scan } from './a11y'
import { expect, skipWithoutWebgl, test } from './fixtures'

// axe-core rules (WCAG 2.0 and 2.1, A and AA) run in Chromium against the production build, in the
// states a visitor reaches on the critical flows, in both themes: contrast depends on the theme.
// Motion is off so a fade does not change a color while the page is scanned.

const THEME_KEY = 'hieu-ui-lab:theme'
const themes = ['light', 'dark'] as const
type Theme = (typeof themes)[number]
const phone = { width: 360, height: 740 }

/** Opens `path` as a returning visitor with `theme` already chosen. */
async function open(page: Page, path: string, theme: Theme) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' })
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value)
    },
    { key: THEME_KEY, value: theme },
  )
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
}

const example = (page: Page, title: string) =>
  page.getByRole('region', { name: title, exact: true })

interface State {
  name: string
  viewport?: { width: number; height: number }
  /** Rules to switch off in this state. See the state that sets it for why. */
  disableRules?: readonly string[]
  /** Get the page into the state to scan. */
  prepare(page: Page, theme: Theme): Promise<void>
}

const states: State[] = [
  {
    name: 'the landing page',
    prepare: (page, theme) => open(page, '/', theme),
  },
  {
    name: 'the component catalog with a search applied',
    async prepare(page, theme) {
      await open(page, '/components?q=button', theme)
      await expect(page.getByRole('list', { name: 'Components results' })).toBeVisible()
    },
  },
  {
    name: 'a component page with its playground',
    async prepare(page, theme) {
      await open(page, '/components/button', theme)
      await expect(page.getByRole('form', { name: 'Playground controls' })).toBeVisible()
    },
  },
  {
    name: 'the sign-in block after a failed submit',
    async prepare(page, theme) {
      await open(page, '/blocks/sign-in-page', theme)
      const demo = example(page, 'Email and password')
      await demo.getByRole('button', { name: 'Sign in', exact: true }).click()
      await expect(demo.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
        'aria-invalid',
        'true',
      )
    },
  },
  {
    name: 'the data table block after sorting',
    async prepare(page, theme) {
      await open(page, '/blocks/data-table', theme)
      const demo = example(page, 'Sorting and pagination')
      await demo.getByRole('button', { name: 'Service' }).click()
      await expect(demo.getByRole('columnheader', { name: 'Service' })).toHaveAttribute(
        'aria-sort',
        'ascending',
      )
    },
  },
  {
    name: 'a documentation page with code samples',
    async prepare(page, theme) {
      await open(page, '/docs/installation', theme)
      // Highlighting is asynchronous: a plain <pre> first, then Shiki's markup.
      await expect(page.locator('.shiki').first()).toBeVisible()
    },
  },
  {
    name: 'the theme customization page',
    async prepare(page, theme) {
      await open(page, '/docs/theming', theme)
      await expect(page.getByRole('group', { name: 'Theme' })).toBeVisible()
    },
  },
  {
    name: 'an engineering note',
    async prepare(page, theme) {
      await open(page, '/notes/theme-without-flash', theme)
      await expect(page.locator('.shiki').first()).toBeVisible()
    },
  },
  {
    name: 'the playground page',
    async prepare(page, theme) {
      await open(page, '/playground', theme)
      await expect(page.getByRole('form', { name: 'Example controls' })).toBeVisible()
    },
  },
  {
    name: 'the map viewer, once every layer is ready',
    async prepare(page, theme) {
      await open(page, '/labs/maps/maplibre-viewer', theme)
      const unavailable = page.getByRole('heading', { name: 'Interactive map unavailable' })
      await expect(page.locator('canvas.maplibregl-canvas').or(unavailable)).toBeVisible()
      await skipWithoutWebgl(unavailable, 'This browser has no WebGL2, so the map cannot run.')
      for (const layer of ['Sites', 'Service route', 'Service zones']) {
        await expect(
          page
            .getByRole('switch', { name: layer, exact: true })
            .locator('xpath=ancestor::li[1]')
            .getByText('Ready'),
        ).toBeVisible()
      }
    },
  },
  {
    name: 'the mobile navigation drawer, open',
    viewport: phone,
    async prepare(page, theme) {
      await open(page, '/', theme)
      await page.getByRole('button', { name: 'Open navigation' }).click()
      await expect(page.getByRole('dialog', { name: 'Hieu UI Lab' })).toBeVisible()
    },
  },
  {
    name: 'the theme menu, open',
    // Radix hides the page behind a modal menu with aria-hidden and keeps focus inside it, but axe
    // recognises that only for an aria-modal dialog, so it reports the page's focusable controls
    // under aria-hidden. The behavior the rule protects, that focus cannot reach the page behind
    // the menu, is tested below. Every other rule still runs on the open menu.
    disableRules: ['aria-hidden-focus'],
    async prepare(page, theme) {
      await open(page, '/components/button', theme)
      await page.getByRole('button', { name: /^Theme:/ }).click()
      await expect(page.getByRole('menuitemradio', { name: 'Dark' })).toBeVisible()
    },
  },
  {
    name: 'the search dialog, with results',
    async prepare(page, theme) {
      await open(page, '/', theme)
      await page.keyboard.press('ControlOrMeta+k')
      await page.getByRole('combobox', { name: 'Search documentation' }).fill('button')
      await expect(page.getByRole('option').first()).toBeVisible()
    },
  },
  {
    name: 'a dialog on a phone screen',
    viewport: phone,
    async prepare(page, theme) {
      await open(page, '/components/dialog', theme)
      await page.getByRole('button', { name: 'Rename project' }).click()
      await expect(page.getByRole('dialog', { name: 'Rename project' })).toBeVisible()
    },
  },
]

for (const theme of themes) {
  for (const state of states) {
    test(`${state.name}, ${theme} theme: no WCAG 2.1 A/AA violations`, async ({ page }) => {
      if (state.viewport) await page.setViewportSize(state.viewport)
      await state.prepare(page, theme)
      await expectNoViolations(page, { disableRules: state.disableRules ?? [] })
    })
  }
}

test('with the theme menu open, Tab and Shift+Tab keep focus in the menu', async ({ page }) => {
  // What the exempted rule, aria-hidden-focus, exists to protect: a person using the keyboard or a
  // screen reader is not sent into the page that the open menu hides.
  await open(page, '/components/button', 'light')
  await page.getByRole('button', { name: /^Theme:/ }).click()
  await expect(page.getByRole('menu')).toBeVisible()
  await expect(page.locator('#root')).toHaveAttribute('aria-hidden', 'true')

  for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab', 'Shift+Tab']) {
    await page.keyboard.press(key)
    const inMenu = await page.evaluate(
      () => document.activeElement?.closest('[role="menu"]') !== null,
    )
    expect(inMenu, `focus left the menu after ${key}`).toBe(true)
  }
})

test.describe('the scan itself', () => {
  // A scan that cannot fail proves nothing. Markup with known faults is added to a live page and
  // the scan has to name each one, including a color pair, since the scans above rely on contrast.
  test('reports an image without a text alternative, an unnamed button, and low contrast', async ({
    page,
  }) => {
    await open(page, '/', 'light')
    await page.evaluate(() => {
      const host = document.createElement('div')
      host.innerHTML = [
        '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="10" height="10">',
        '<button type="button"></button>',
        '<p style="color:#8a8a8a;background:#9a9a9a">Low contrast text</p>',
      ].join('')
      document.body.append(host)
    })

    const { violations } = await scan(page)
    const ids = violations.map((violation) => violation.id)
    expect(ids).toEqual(expect.arrayContaining(['image-alt', 'button-name', 'color-contrast']))
  })

  test('can be limited to one part of the page', async ({ page }) => {
    await open(page, '/', 'light')
    await page.evaluate(() => {
      const faulty = document.createElement('button')
      faulty.id = 'faulty'
      document.body.append(faulty)
    })

    expect((await scan(page, { include: ['#faulty'] })).violations.map((v) => v.id)).toEqual([
      'button-name',
    ])
    expect((await scan(page, { include: ['main'] })).violations.map((v) => v.id)).not.toContain(
      'button-name',
    )
  })
})

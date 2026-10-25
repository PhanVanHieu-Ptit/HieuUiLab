import type { Locator, Page } from '@playwright/test'

import { expect, guardNetwork, test } from './fixtures'

const style = (locator: Locator, property: string) =>
  locator.evaluate((node, name) => getComputedStyle(node).getPropertyValue(name), property)

/** Opens the playground with the site itself in `theme`, as a returning visitor would have it. */
async function open(page: Page, path: string, theme: 'light' | 'dark' = 'light') {
  await page.addInitScript((value) => {
    localStorage.setItem('hieu-ui-lab:theme', value)
  }, theme)
  await page.goto(path)
  await expect(page.getByRole('heading', { level: 1, name: 'Playground' })).toBeVisible()
}

const controls = (page: Page) => page.getByRole('form', { name: 'Example controls' })

test.describe('playground', () => {
  test('changing controls changes the real component and the usage code', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await open(page, '/playground')

    const button = page.getByRole('group', { name: 'Button preview' }).getByRole('button')
    await expect(button).toHaveText('Save changes')
    const before = await style(button, 'background-color')

    await controls(page).getByRole('textbox', { name: 'Label' }).fill('Remove')
    await controls(page).getByRole('combobox', { name: 'Variant' }).selectOption('destructive')
    await controls(page).getByRole('radio', { name: 'lg' }).check()
    await controls(page).getByRole('switch', { name: 'Loading' }).click()

    await expect(button).toHaveText('Remove')
    await expect(button).toBeDisabled()
    await expect(button).toHaveAttribute('aria-busy', 'true')
    expect(await style(button, 'background-color')).not.toBe(before)
    expect((await button.boundingBox())?.height).toBe(40)
    await expect(page.getByRole('figure').first()).toContainText(
      '<Button variant="destructive" size="lg" loading>Remove</Button>',
    )
    expect(errors).toEqual([])
  })

  test('the preview theme is scoped to the frame, in both directions', async ({ page }) => {
    await open(page, '/playground?example=badge')
    const frame = page.getByRole('group', { name: 'Badge preview' })
    const siteLight = await style(frame, 'background-color')
    const pageLight = await style(page.locator('body'), 'background-color')

    await page.getByRole('radio', { name: 'Dark' }).check()
    const forcedDark = await style(frame, 'background-color')
    expect(forcedDark).not.toBe(siteLight)
    await expect(page.locator('html')).not.toHaveClass(/dark/)
    expect(await style(page.locator('body'), 'background-color')).toBe(pageLight)
  })

  test('a light frame on a dark page matches a light frame on a light page', async ({
    browser,
    baseURL,
  }) => {
    async function frameLook(siteTheme: 'light' | 'dark', previewTheme: string) {
      if (baseURL === undefined) throw new Error('playwright.config.ts must set use.baseURL')
      const context = await browser.newContext()
      // The fixture guards the test's own context; one opened here needs the guard too.
      const guard = await guardNetwork(context, baseURL)
      const page = await context.newPage()
      await open(page, '/playground?example=button', siteTheme)
      // Colors transition when the theme changes, and headless Chrome only advances a transition
      // when it draws a frame. Turn them off so every read is the color at rest.
      await page.addStyleTag({
        content:
          '*, *::before, *::after { transition: none !important; animation: none !important }',
      })
      await page.getByRole('radio', { name: previewTheme, exact: true }).check()
      const frame = page.getByRole('group', { name: 'Button preview' })
      // The radio is checked before React has put the class on the frame; wait for the class.
      if (previewTheme === 'Site') await expect(frame).not.toHaveClass(/\b(?:light|dark)\b/)
      else await expect(frame).toHaveClass(new RegExp(`\\b${previewTheme.toLowerCase()}\\b`))
      const button = frame.getByRole('button')
      const look = {
        background: await style(frame, 'background-color'),
        text: await style(frame, 'color'),
        buttonBackground: await style(button, 'background-color'),
        // Not on focus: the color is set at rest, so the ring is the same one when it shows.
        ring: await style(button, 'outline-color'),
        scheme: await style(frame, 'color-scheme'),
      }
      await context.close()
      expect(guard.blocked, 'requests to somewhere other than the site itself').toEqual([])
      return look
    }

    const lightEverywhere = await frameLook('light', 'Light')
    const lightOnDark = await frameLook('dark', 'Light')
    const darkOnLight = await frameLook('light', 'Dark')
    const darkEverywhere = await frameLook('dark', 'Dark')
    const followsDarkSite = await frameLook('dark', 'Site')

    expect(lightOnDark).toEqual(lightEverywhere)
    expect(darkOnLight).toEqual(darkEverywhere)
    expect(followsDarkSite).toEqual(darkEverywhere)
    expect(lightEverywhere.background).not.toBe(darkEverywhere.background)
    expect(lightEverywhere.ring).not.toBe(darkEverywhere.ring)
    expect(lightOnDark.scheme).toBe('light')
    expect(darkOnLight.scheme).toBe('dark')
  })

  test('the width presets resize the frame', async ({ page }) => {
    await open(page, '/playground?example=badge')
    const frame = page.getByRole('group', { name: 'Badge preview' })
    const full = (await frame.boundingBox())?.width ?? 0

    await page.getByRole('radio', { name: 'Mobile 375px' }).check()
    expect((await frame.boundingBox())?.width).toBe(375)
    await page.getByRole('radio', { name: 'Tablet 768px' }).check()
    expect((await frame.boundingBox())?.width).toBe(768)
    await page.getByRole('radio', { name: 'Full' }).check()
    expect((await frame.boundingBox())?.width).toBeCloseTo(full, 0)
  })

  test('a Dialog opens inside the frame, in the frame theme, and closes with Escape', async ({
    page,
  }) => {
    await open(page, '/playground?example=dialog')
    const frame = page.getByRole('group', { name: 'Dialog preview' })
    const trigger = frame.getByRole('button', { name: 'Open dialog' })

    await page.getByRole('radio', { name: 'Dark' }).check()
    await page.getByRole('radio', { name: 'Mobile 375px' }).check()
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Delete this component?' })
    await expect(dialog).toBeVisible()
    const frameBox = await frame.boundingBox()
    // The animation moves the panel; wait for it to settle before measuring.
    await expect(async () => {
      const box = await dialog.boundingBox()
      expect(box).not.toBeNull()
      expect(box?.x).toBeGreaterThanOrEqual((frameBox?.x ?? 0) - 1)
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        (frameBox?.x ?? 0) + (frameBox?.width ?? 0) + 1,
      )
      expect(box?.y).toBeGreaterThanOrEqual((frameBox?.y ?? 0) - 1)
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        (frameBox?.y ?? 0) + (frameBox?.height ?? 0) + 1,
      )
    }).toPass()

    // The dialog took the dark frame's tokens, not the light page's.
    const lightSurface = await style(page.locator('body'), 'background-color')
    expect(await style(dialog, 'background-color')).not.toBe(lightSurface)
    expect(await dialog.evaluate((node) => node.closest('.dark') !== null)).toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    // The modal gave the page back.
    await expect(page.locator('body')).not.toHaveCSS('pointer-events', 'none')
    await page.getByRole('radio', { name: 'Light' }).check()
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked()
  })

  test('the Dialog fits the frame at the mobile width', async ({ page }) => {
    await open(page, '/playground?example=dialog')
    await page.getByRole('radio', { name: 'Mobile 375px' }).check()
    const frame = page.getByRole('group', { name: 'Dialog preview' })
    await frame.getByRole('button', { name: 'Open dialog' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(async () => {
      const box = await dialog.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(375)
    }).toPass()
  })

  test('copies the usage example and the configuration exactly as shown', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await open(page, '/playground?example=data-table')
    await controls(page).getByRole('switch', { name: 'Row selection' }).click()
    await page.getByRole('radio', { name: 'Dark' }).check()

    await page.getByRole('button', { name: 'Copy usage example' }).click()
    const usage = await page.evaluate(() => navigator.clipboard.readText())
    expect(usage).toContain(
      "import { DataTable, type DataTableColumn } from '@/components/blocks/data-table'",
    )
    expect(usage).toContain('selectedIds,')
    expect(usage).toContain('defaultPageSize={5}')
    // What is copied is what is on the page.
    const shown = await page.getByRole('figure').first().innerText()
    expect(shown.replace(/\s+/g, ' ')).toContain(usage.split('\n')[0]?.replace(/\s+/g, ' ') ?? '')

    await page.getByRole('button', { name: 'Copy configuration' }).click()
    const configuration: unknown = JSON.parse(
      await page.evaluate(() => navigator.clipboard.readText()),
    )
    expect(configuration).toEqual({
      example: 'data-table',
      controls: {
        label: 'Recent deployments',
        state: 'ready',
        rows: 12,
        pageSize: 5,
        showCaption: true,
        selectable: true,
        sortable: true,
      },
      theme: 'dark',
      viewport: 'full',
    })
  })

  test('Reset restores the documented defaults', async ({ page }) => {
    await open(page, '/playground?example=data-table')
    const table = page.getByRole('group', { name: 'Data table preview' })
    await expect(table.getByRole('row')).toHaveCount(6)

    await controls(page).getByRole('spinbutton', { name: 'Rows per page' }).fill('10')
    await controls(page).getByRole('radio', { name: 'loading' }).check()
    await page.getByRole('radio', { name: 'Dark' }).check()
    await page.getByRole('radio', { name: 'Tablet 768px' }).check()

    await page.getByRole('button', { name: 'Reset' }).click()

    await expect(controls(page).getByRole('spinbutton', { name: 'Rows per page' })).toHaveValue('5')
    await expect(controls(page).getByRole('radio', { name: 'ready' })).toBeChecked()
    await expect(page.getByRole('radio', { name: 'Site' })).toBeChecked()
    await expect(page.getByRole('radio', { name: 'Full' })).toBeChecked()
    await expect(table.getByRole('row')).toHaveCount(6)
    await expect(page.getByRole('button', { name: 'Reset' })).toBeFocused()
  })

  test('refuses what a number field cannot take, in the real browser', async ({ page }) => {
    await open(page, '/playground?example=data-table')
    const field = controls(page).getByRole('spinbutton', { name: 'Rows per page' })
    await field.fill('')
    // The browser reports "1e" as a bad input with an empty value.
    await field.pressSequentially('1e')
    await expect(controls(page).getByRole('alert')).toHaveText(
      'Enter a whole number from 1 to 100.',
    )
    await expect(field).toHaveAttribute('aria-invalid', 'true')

    await field.fill('250')
    await expect(controls(page).getByRole('alert')).toBeVisible()
    await field.blur()
    await expect(controls(page).getByRole('alert')).toBeHidden()
    await expect(field).toHaveValue('1')
  })

  test('every control and action works from the keyboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await open(page, '/playground?example=badge')
    const frame = page.getByRole('group', { name: 'Badge preview' })

    // Radios: arrow keys move and select.
    await page.getByRole('radio', { name: 'Site' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked()
    await expect(frame).toHaveClass(/\blight\b/)
    await page.keyboard.press('ArrowRight')
    await expect(frame).toHaveClass(/\bdark\b/)

    // A text field takes focus and typing.
    await controls(page).getByRole('textbox', { name: 'Label' }).focus()
    await page.keyboard.press('Control+A')
    await page.keyboard.type('Shipped')
    await expect(frame.getByText('Shipped')).toBeVisible()

    // A native select changes with the keyboard once focused.
    const variant = controls(page).getByRole('combobox', { name: 'Variant' })
    await variant.focus()
    await variant.selectOption('success')
    await expect(frame.getByText('Shipped')).toBeVisible()

    // Reset and Copy are buttons: Enter and Space work.
    await page.getByRole('button', { name: 'Reset' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('radio', { name: 'Site' })).toBeChecked()
    await expect(frame.getByText('Beta')).toBeVisible()

    await page.getByRole('button', { name: 'Copy configuration' }).focus()
    await page.keyboard.press('Space')
    await expect(page.getByText('Copied to clipboard')).toBeAttached()

    // Tab leaves no control behind: a visible focus ring on each of them.
    await page.getByRole('radio', { name: 'Site' }).focus()
    const reached = new Set<string>()
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab')
      const label = await page.evaluate(() => {
        const active = document.activeElement
        return active?.getAttribute('aria-label') ?? active?.textContent ?? active?.tagName ?? ''
      })
      reached.add(label)
    }
    for (const name of ['Reset', 'Copy usage example', 'Copy configuration']) {
      expect(reached.has(name), name).toBe(true)
    }
  })

  test('the example list is real navigation: addressable, and Back works', async ({ page }) => {
    await open(page, '/playground')
    const list = page.getByRole('navigation', { name: 'Playground examples' })
    await list.getByRole('link', { name: 'Dialog' }).click()
    await expect(page).toHaveURL(/\/playground\?example=dialog$/)
    await expect(page.getByRole('heading', { level: 2, name: 'Dialog' })).toBeVisible()

    await list.getByRole('link', { name: 'Data table' }).click()
    await expect(page).toHaveURL(/example=data-table$/)

    await page.goBack()
    await expect(page.getByRole('heading', { level: 2, name: 'Dialog' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: 'Dialog' })).toBeVisible()
  })

  test('state does not leak from one example to another', async ({ page }) => {
    await open(page, '/playground?example=button')
    await controls(page).getByRole('switch', { name: 'Disabled' }).click()
    await page.getByRole('radio', { name: 'Dark' }).check()

    await page
      .getByRole('navigation', { name: 'Playground examples' })
      .getByRole('link', { name: 'Input' })
      .click()
    await expect(page.getByRole('heading', { level: 2, name: 'Input' })).toBeVisible()
    await expect(controls(page).getByRole('switch', { name: 'Disabled' })).not.toBeChecked()
    await expect(page.getByRole('radio', { name: 'Site' })).toBeChecked()
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEnabled()
  })

  test('an unknown example id falls back without breaking', async ({ page }) => {
    await open(page, '/playground?example=nope')
    await expect(page.getByRole('heading', { level: 2, name: 'Button' })).toBeVisible()
    await expect(page.getByText('There is no example called “nope”')).toBeVisible()
    await expect(page).toHaveURL(/example=nope$/)
  })
})

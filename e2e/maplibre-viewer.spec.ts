import type { Locator, Page } from '@playwright/test'

import { expect, skipWithoutWebgl, test } from './fixtures'

// The unit tests replace MapLibre with a stand-in, because jsdom has no WebGL. These tests run the
// real library in the production build, which is the only place a missing worker file, a failed
// start, or a leaked map shows up.

const ROUTE = '/labs/maps/maplibre-viewer'
const CANVAS = 'canvas.maplibregl-canvas'

function layerRow(page: Page, name: 'Sites' | 'Service route' | 'Service zones'): Locator {
  return page.getByRole('switch', { name, exact: true }).locator('xpath=ancestor::li[1]')
}

/**
 * Open the viewer and wait for its first draw. Where the browser has no WebGL2 this skips, or on CI
 * fails, because CI is expected to run the real map.
 */
async function openViewer(page: Page) {
  await page.goto(ROUTE)
  const canvas = page.locator(CANVAS)
  const unavailable = page.getByRole('heading', { name: 'Interactive map unavailable' })
  await expect(canvas.or(unavailable)).toBeVisible()
  await skipWithoutWebgl(unavailable, 'This browser has no WebGL2, so the map cannot run.')
  await expect(layerRow(page, 'Sites').getByText('Ready')).toBeVisible()
  await expect(layerRow(page, 'Service route').getByText('Ready')).toBeVisible()
  await expect(layerRow(page, 'Service zones').getByText('Ready')).toBeVisible()
  return { canvas, map: page.locator('.maplibregl-map') }
}

/**
 * The map's pixels, with square corners. The card that clips the map rounds its corners, and how
 * that edge is anti-aliased depends on the page's sub-pixel scroll position, which a click moves.
 */
function pixels(map: Locator): Promise<Buffer> {
  return map.screenshot({ animations: 'disabled', style: '* { border-radius: 0 !important }' })
}

/** Failures the page raised on its own: uncaught errors and `console.error`, not driver warnings. */
function collectFailures(page: Page): string[] {
  const failures: string[] = []
  page.on('pageerror', (error) => {
    failures.push(`pageerror: ${error.message}`)
  })
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`console.error: ${message.text()}`)
  })
  return failures
}

test.describe('map viewer', () => {
  test('starts one map, draws every layer, and asks nobody else for anything', async ({ page }) => {
    const failures = collectFailures(page)
    const requested: string[] = []
    page.on('request', (request) => {
      requested.push(request.url())
    })

    const { canvas } = await openViewer(page)

    await expect(canvas).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Zoom in' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zoom out' })).toBeVisible()
    await expect(page.locator('.maplibregl-ctrl-attrib')).toContainText('Synthetic sample data')
    await expect(page.getByRole('status', { name: 'Loading map' })).toHaveCount(0)

    // The bundled basemap needs no tiles, fonts or style from a provider: everything the page
    // fetched came from its own origin, or is an inline data or blob URL.
    const base = new URL(page.url()).origin
    const outside = requested.filter((url) => {
      if (url.startsWith('data:') || url.startsWith('blob:')) return false
      return new URL(url).origin !== base
    })
    expect(outside, `requests to somewhere other than ${base}`).toEqual([])
    expect(failures).toEqual([])
  })

  test('says so, and downloads no map code, when WebGL2 is missing', async ({ page }) => {
    // Runs in the page before any script: a browser whose canvases refuse a WebGL2 context.
    await page.addInitScript(() => {
      const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')
        ?.value as (this: HTMLCanvasElement, type: string, ...rest: unknown[]) => unknown
      Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
        configurable: true,
        writable: true,
        value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
          return type === 'webgl2' ? null : original.call(this, type, ...rest)
        },
      })
    })
    const libraryRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/assets/maplibre-gl')) libraryRequests.push(request.url())
    })

    await page.goto(ROUTE)
    await expect(page.getByRole('heading', { name: 'Interactive map unavailable' })).toBeVisible()
    await expect(page.locator(CANVAS)).toHaveCount(0)
    expect(libraryRequests).toEqual([])
  })

  test('follows its container when the window is resized', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const { canvas, map } = await openViewer(page)

    const matchesContainer = async () => {
      const [mapBox, canvasBox] = await Promise.all([map.boundingBox(), canvas.boundingBox()])
      return mapBox !== null && canvasBox !== null && Math.abs(canvasBox.width - mapBox.width) <= 1
    }
    await expect.poll(matchesContainer).toBe(true)
    const wide = (await map.boundingBox())?.width ?? 0

    await page.setViewportSize({ width: 360, height: 740 })
    await expect.poll(matchesContainer).toBe(true)
    const narrow = (await map.boundingBox())?.width ?? 0
    expect(narrow).toBeLessThan(360)
    expect(narrow).toBeLessThan(wide)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect.poll(matchesContainer).toBe(true)
    expect((await map.boundingBox())?.width ?? 0).toBeGreaterThan(narrow)
  })

  test('hides and shows a layer on the map, and says so', async ({ page }) => {
    const { map } = await openViewer(page)
    const sites = page.getByRole('switch', { name: 'Sites', exact: true })
    const before = await pixels(map)

    await sites.click()
    await expect(sites).not.toBeChecked()
    await expect(layerRow(page, 'Sites').getByText('Hidden')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Lumen Harbour/ })).toBeDisabled()
    await expect.poll(async () => (await pixels(map)).equals(before)).toBe(false)
    // The other layers are untouched.
    await expect(layerRow(page, 'Service route').getByText('Ready')).toBeVisible()

    await sites.click()
    await expect(sites).toBeChecked()
    await expect(layerRow(page, 'Sites').getByText('Ready')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Lumen Harbour/ })).toBeEnabled()
    await expect.poll(async () => (await pixels(map)).equals(before)).toBe(true)
  })

  test('selects a feature from the map and from the list, and clears it', async ({ page }) => {
    const { canvas, map } = await openViewer(page)
    const panel = page.getByRole('region', { name: 'Selected feature' })
    const before = await pixels(map)
    await expect(panel).toContainText('Nothing is selected')

    // The map opens centred on the hub, so the middle of the canvas is the first site.
    await canvas.click()
    await expect(panel).toContainText('Lumen Harbour')
    await expect(panel.getByText('lumen-harbour')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Lumen Harbour/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect.poll(async () => (await pixels(map)).equals(before)).toBe(false)

    // A click on open water selects nothing.
    await canvas.click({ position: { x: 24, y: 24 } })
    await expect(panel).toContainText('Nothing is selected')
    await expect.poll(async () => (await pixels(map)).equals(before)).toBe(true)

    await page.getByRole('button', { name: /^East Quay/ }).click()
    await expect(panel).toContainText('East Quay')

    await page.getByRole('button', { name: /^Coastal service loop/ }).click()
    await expect(panel.getByText('Length')).toBeVisible()
    await expect(panel).toContainText('km')

    await panel.getByRole('button', { name: 'Clear' }).click()
    await expect(panel).toContainText('Nothing is selected')
  })

  test('removes the map when the visitor leaves, and builds one new map on return', async ({
    page,
  }) => {
    const failures = collectFailures(page)
    let workers = 0
    page.on('worker', () => {
      workers += 1
    })

    await openViewer(page)
    expect(workers).toBeGreaterThan(0)
    const started = workers

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Labs' }).click()
    await expect(page).toHaveURL(/\/labs$/)
    await expect(page.locator(CANVAS)).toHaveCount(0)
    await expect(page.locator('.maplibregl-map')).toHaveCount(0)

    await page.goBack()
    await expect(page.locator(CANVAS)).toHaveCount(1)
    await expect(page.locator('.maplibregl-map')).toHaveCount(1)
    await expect(layerRow(page, 'Sites').getByText('Ready')).toBeVisible()
    // MapLibre keeps one shared worker for the life of the page, so a second visit reuses it. A
    // count that grew would mean each visit left a map behind.
    expect(workers).toBe(started)
    expect(failures).toEqual([])
  })
})

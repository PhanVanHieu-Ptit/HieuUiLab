import type { Locator, Page } from '@playwright/test'

import { expect, skipWithoutWebgl, test } from './fixtures'

// The unit tests replace the renderer with a stand-in, because jsdom has no WebGL. These tests run
// the real library in the production build, which is the only place a missing chunk, a shader that
// does not link, a leaked context, or a loop that never stops shows up.

const ROUTE = '/labs/3d/three-scene'
const CANVAS = 'canvas[role="img"]'

/** Counts every animation frame the page asks for, and every WebGL2 context it creates. */
async function instrument(page: Page) {
  await page.addInitScript(() => {
    const spy = { frames: 0, contexts: [] as WebGL2RenderingContext[] }
    Object.defineProperty(window, '__spy', { value: spy })
    const request = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (callback) => {
      spy.frames += 1
      return request(callback)
    }
    const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext')
      ?.value as (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) => RenderingContext | null
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      configurable: true,
      writable: true,
      value(this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
        const context = original.call(this, type, ...rest)
        if (
          type === 'webgl2' &&
          context &&
          !spy.contexts.includes(context as WebGL2RenderingContext)
        ) {
          spy.contexts.push(context as WebGL2RenderingContext)
        }
        return context
      },
    })
  })
}

const animationFrames = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spy: { frames: number } }).__spy.frames)

/** How many WebGL2 contexts the page created that have not been lost. */
const liveContexts = (page: Page) =>
  page.evaluate(
    () =>
      (
        window as unknown as { __spy: { contexts: WebGL2RenderingContext[] } }
      ).__spy.contexts.filter((context) => !context.isContextLost()).length,
  )

function stat(page: Page, label: string): Locator {
  return page.locator('dt', { hasText: label }).locator('xpath=following-sibling::dd')
}

/** A renderer counter, read from the stats panel. The panel may be closed: only its text is read. */
async function readStat(page: Page, label: string): Promise<number> {
  return Number((await stat(page, label).textContent()) ?? 'NaN')
}

const framesDrawn = (page: Page) => readStat(page, 'Frames drawn so far')

/**
 * Wait until the scene has stopped asking for animation frames. The stats panel cannot say: it is
 * updated only when the scene goes quiet, so it holds still during a flight too.
 */
async function settled(page: Page) {
  let last = -1
  await expect
    .poll(
      async () => {
        const now = await animationFrames(page)
        const still = now === last
        last = now
        return still
      },
      { intervals: [300], timeout: 15_000 },
    )
    .toBe(true)
}

/**
 * Open the scene and wait for its first draw. Where the browser has no WebGL2 this skips, or on CI
 * fails, because CI is expected to run the real scene.
 */
async function openScene(page: Page) {
  await page.goto(ROUTE)
  const canvas = page.locator(CANVAS)
  const unavailable = page.getByRole('heading', { name: '3D scene unavailable' })
  await expect(canvas.or(unavailable)).toBeVisible()
  await skipWithoutWebgl(unavailable, 'This browser has no WebGL2, so the scene cannot run.')
  await expect(page.getByRole('status', { name: 'Loading 3D scene' })).toHaveCount(0)
  await expect(stat(page, 'Frames drawn so far')).not.toHaveText('–')
  await settled(page)
  return { canvas, viewport: canvas.locator('xpath=..') }
}

/**
 * The viewport's pixels, with square corners and without the site header. The card that clips the
 * scene rounds its corners, and the header is sticky, so it can be drawn over the top of the
 * viewport. The page is also scrolled to a whole-pixel position first: left to itself, the
 * screenshot scrolls the element into view by whatever fraction it likes, and the canvas is
 * sampled differently at each offset.
 */
async function pixels(viewport: Locator): Promise<Buffer> {
  await viewport.evaluate((element) => {
    window.scrollTo(0, Math.floor(element.getBoundingClientRect().top + window.scrollY) - 90)
  })
  return viewport.screenshot({
    animations: 'disabled',
    style: 'header { visibility: hidden !important } * { border-radius: 0 !important }',
  })
}

/** How many different colours a PNG holds: one for a blank image, many for a lit, shaded scene. */
function colourCount(page: Page, png: Buffer): Promise<number> {
  return page.evaluate(async (base64) => {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }))
    const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d')
    if (!context) return 0
    context.drawImage(bitmap, 0, 0)
    const { data } = context.getImageData(0, 0, bitmap.width, bitmap.height)
    const seen = new Set<number>()
    for (let index = 0; index < data.length; index += 4) {
      seen.add(((data[index] ?? 0) << 16) | ((data[index + 1] ?? 0) << 8) | (data[index + 2] ?? 0))
    }
    return seen.size
  }, png.toString('base64'))
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

test.describe('three.js scene', () => {
  test.beforeEach(async ({ page }) => {
    await instrument(page)
  })

  test('draws five solids on a stage, and asks nobody else for anything', async ({ page }) => {
    const failures = collectFailures(page)
    const requested: string[] = []
    page.on('request', (request) => {
      requested.push(request.url())
    })

    const { canvas, viewport } = await openScene(page)

    await expect(canvas).toHaveCount(1)
    expect(await colourCount(page, await pixels(viewport))).toBeGreaterThan(50)

    // Five solids, the stage, and its grid: seven draw calls, and seven geometries on the GPU.
    // Counts of what was built, so a leak across visits or a duplicated mesh shows up here.
    expect(await readStat(page, 'Draw calls in the last frame')).toBe(7)
    expect(await readStat(page, 'Geometries on the GPU')).toBe(7)
    expect(await readStat(page, 'Textures on the GPU')).toBe(0)
    expect(await readStat(page, 'Triangles in the last frame')).toBeGreaterThan(1000)

    // Everything came from the site's own origin. The chunk is also a positive control for the
    // "no download" test below, which looks for this name.
    expect(requested.some((url) => url.includes('/assets/scene-runtime'))).toBe(true)
    const base = new URL(page.url()).origin
    const outside = requested.filter((url) => {
      if (url.startsWith('data:') || url.startsWith('blob:')) return false
      return new URL(url).origin !== base
    })
    expect(outside, `requests to somewhere other than ${base}`).toEqual([])
    expect(failures).toEqual([])
  })

  test('says so, and downloads no 3D code, when WebGL2 is missing', async ({ page }) => {
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
    const chunkRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/assets/scene-runtime')) chunkRequests.push(request.url())
    })

    await page.goto(ROUTE)
    await expect(page.getByRole('heading', { name: '3D scene unavailable' })).toBeVisible()
    await expect(page.locator(CANVAS)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Reset camera' })).toHaveCount(0)
    expect(chunkRequests).toEqual([])
  })

  test('draws only when something changes: an idle scene asks for no animation frames', async ({
    page,
  }) => {
    await openScene(page)
    const drawnBefore = await framesDrawn(page)
    const requestedBefore = await animationFrames(page)

    await page.waitForTimeout(700)

    expect(await animationFrames(page)).toBe(requestedBefore)
    expect(await framesDrawn(page)).toBe(drawnBefore)

    // And it wakes up for a change, then goes quiet again.
    await page.getByRole('button', { name: 'Zoom in' }).click()
    await expect.poll(() => framesDrawn(page)).toBeGreaterThan(drawnBefore)
    await settled(page)
    const quietAt = await animationFrames(page)
    await page.waitForTimeout(500)
    expect(await animationFrames(page)).toBe(quietAt)
  })

  test('selects a solid from the scene and from the list, and clears it', async ({ page }) => {
    const { canvas, viewport } = await openScene(page)
    const panel = page.getByRole('region', { name: 'Selected solid' })
    const before = await pixels(viewport)
    await expect(panel).toContainText('Nothing is selected')

    // The camera looks at the box, so the middle of the canvas is the box.
    await canvas.click()
    await expect(panel).toContainText('Box')
    await expect(panel.getByText('BoxGeometry')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Box/ })).toHaveAttribute('aria-pressed', 'true')
    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(false)

    // A click on the open stage selects nothing, and the box returns to its own colour.
    await canvas.click({ position: { x: 24, y: 24 } })
    await expect(panel).toContainText('Nothing is selected')
    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(true)

    await page.getByRole('button', { name: /^Cone/ }).click()
    await expect(panel).toContainText('Cone')
    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(false)

    await panel.getByRole('button', { name: 'Clear' }).click()
    await expect(panel).toContainText('Nothing is selected')
    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(true)
  })

  test('orbits when dragged, and a drag selects nothing', async ({ page }) => {
    const { canvas, viewport } = await openScene(page)
    const before = await pixels(viewport)
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    const centre = {
      x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
      y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
    }

    await page.mouse.move(centre.x, centre.y)
    await page.mouse.down()
    await page.mouse.move(centre.x + 160, centre.y + 20, { steps: 12 })
    await page.mouse.up()

    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(false)
    // The press began on the box, but it moved: that is a drag, not a click.
    await expect(page.getByRole('region', { name: 'Selected solid' })).toContainText(
      'Nothing is selected',
    )
    await settled(page)
  })

  test('moves the camera with the buttons, from a keyboard, and Reset camera restores the first frame', async ({
    page,
  }) => {
    const { viewport } = await openScene(page)
    const first = await pixels(viewport)

    const orbit = page.getByRole('button', { name: 'Orbit right' })
    await orbit.focus()
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter')
    await expect.poll(async () => (await pixels(viewport)).equals(first)).toBe(false)
    await page.getByRole('button', { name: 'Raise camera' }).click()
    await page.getByRole('button', { name: 'Zoom out' }).click()
    await settled(page)

    await page.getByRole('button', { name: 'Reset camera' }).click()
    await expect
      .poll(async () => (await pixels(viewport)).equals(first), { timeout: 10_000 })
      .toBe(true)
  })

  test('stops zooming at its limits however many times the button is pressed', async ({ page }) => {
    const { viewport } = await openScene(page)
    const zoomIn = page.getByRole('button', { name: 'Zoom in' })
    for (let press = 0; press < 12; press += 1) await zoomIn.click()
    await settled(page)
    const closest = await pixels(viewport)
    for (let press = 0; press < 6; press += 1) await zoomIn.click()
    await settled(page)
    expect((await pixels(viewport)).equals(closest)).toBe(true)
    // Still drawing a scene, not looking at the inside of a solid.
    expect(await colourCount(page, closest)).toBeGreaterThan(20)
  })

  test('scrolls the page on a plain wheel, and zooms on Ctrl and wheel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 700 })
    const { canvas, viewport } = await openScene(page)
    await canvas.scrollIntoViewIfNeeded()
    const before = await pixels(viewport)
    const box = await canvas.boundingBox()
    await page.mouse.move((box?.x ?? 0) + 200, (box?.y ?? 0) + 150)
    const scrolledFrom = await page.evaluate(() => window.scrollY)
    const requestedBefore = await animationFrames(page)

    await page.mouse.wheel(0, 240)
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrolledFrom)
    // The page moved and the scene did not react: scrolling past it is not blocked by it.
    const scrolledTo = await page.evaluate(() => window.scrollY)
    expect(await animationFrames(page)).toBe(requestedBefore)
    expect((await pixels(viewport)).equals(before)).toBe(true)

    // Ctrl and wheel is what a trackpad pinch sends. It zooms, and the page stays where it is.
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await canvas.scrollIntoViewIfNeeded()
    const scrolledAt = await page.evaluate(() => window.scrollY)
    const wheel = await canvas.evaluate((element) => {
      const event = new WheelEvent('wheel', {
        deltaY: -300,
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      })
      element.dispatchEvent(event)
      return event.defaultPrevented
    })
    expect(wheel).toBe(true)
    expect(await page.evaluate(() => window.scrollY)).toBe(scrolledAt)
    expect(scrolledTo).not.toBe(scrolledFrom)
    await expect.poll(async () => (await pixels(viewport)).equals(before)).toBe(false)
  })

  test('follows its container when the window is resized', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    const { canvas, viewport } = await openScene(page)

    // The container has a border, so the canvas fills its inner width, not its outer one.
    const matchesContainer = async () => {
      const [inner, canvasBox] = await Promise.all([
        viewport.evaluate((element) => element.clientWidth),
        canvas.boundingBox(),
      ])
      return canvasBox !== null && Math.abs(canvasBox.width - inner) <= 1
    }
    await expect.poll(matchesContainer).toBe(true)
    const wide = (await viewport.boundingBox())?.width ?? 0

    await page.setViewportSize({ width: 360, height: 740 })
    await expect.poll(matchesContainer).toBe(true)
    const narrow = (await viewport.boundingBox())?.width ?? 0
    expect(narrow).toBeLessThan(360)
    expect(narrow).toBeLessThan(wide)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
    // The new size is drawn, not left blank.
    await settled(page)
    expect(await colourCount(page, await pixels(viewport))).toBeGreaterThan(50)

    await page.setViewportSize({ width: 1280, height: 900 })
    await expect.poll(matchesContainer).toBe(true)
    expect((await viewport.boundingBox())?.width ?? 0).toBeGreaterThan(narrow)
  })

  test('has no camera inertia, and resets with a jump, when the system asks for reduced motion', async ({
    page,
  }) => {
    const reducedFrames = async (reduced: boolean) => {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
      await openScene(page)
      await page.getByRole('button', { name: 'Zoom in' }).click()
      await settled(page)
      const before = await framesDrawn(page)
      await page.getByRole('button', { name: 'Reset camera' }).click()
      await expect.poll(() => framesDrawn(page)).toBeGreaterThan(before)
      await settled(page)
      return (await framesDrawn(page)) - before
    }

    const withMotion = await reducedFrames(false)
    const withoutMotion = await reducedFrames(true)

    // A flight takes many frames to arrive. A jump takes the one that shows it.
    expect(withMotion).toBeGreaterThan(4)
    expect(withoutMotion).toBeLessThanOrEqual(3)
  })

  test('says so when the graphics context is lost, and draws again when it returns', async ({
    page,
  }) => {
    const { canvas, viewport } = await openScene(page)
    const alert = page.getByText('The graphics context was lost')

    // A lost context hides its extensions, so the one that can restore it is kept from before.
    await canvas.evaluate((element) => {
      const gl = (element as HTMLCanvasElement).getContext('webgl2')
      const lose = gl?.getExtension('WEBGL_lose_context')
      Object.defineProperty(window, '__lose', { value: lose, configurable: true })
      lose?.loseContext()
    })
    await expect(alert).toBeVisible()

    await page.evaluate(() => {
      ;(window as unknown as { __lose: WEBGL_lose_context }).__lose.restoreContext()
    })
    await expect(alert).toHaveCount(0)
    await page.getByRole('button', { name: 'Orbit left' }).click()
    await settled(page)
    expect(await colourCount(page, await pixels(viewport))).toBeGreaterThan(50)
  })

  test('removes the scene when the visitor leaves, and builds one new one on return', async ({
    page,
  }) => {
    const failures = collectFailures(page)
    await openScene(page)
    expect(await liveContexts(page)).toBe(1)

    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Labs' }).click()
    await expect(page).toHaveURL(/\/labs$/)
    await expect(page.locator(CANVAS)).toHaveCount(0)
    // The context is released with the scene, not left for the browser to collect: browsers cap
    // how many a page may hold.
    await expect.poll(() => liveContexts(page)).toBe(0)

    await page.goBack()
    await expect(page.locator(CANVAS)).toHaveCount(1)
    await expect(stat(page, 'Frames drawn so far')).not.toHaveText('–')
    await settled(page)
    expect(await liveContexts(page)).toBe(1)
    // A new scene starts from nothing: the same seven geometries, not the first visit's and more.
    expect(await readStat(page, 'Geometries on the GPU')).toBe(7)
    expect(failures).toEqual([])
  })
})

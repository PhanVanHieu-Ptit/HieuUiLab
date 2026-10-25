import { expect, test } from './fixtures'

// A direct visit to a lazy page paints a fallback first and the page when its code arrives. The
// footer sits under the fallback, and if the fallback is short the footer is in view and the page
// pushes it out, which the browser counts as layout shift. Every script is delayed here so the
// fallback is always on screen first; a fast machine would otherwise sometimes skip that moment.

const DELAY_MS = 250
const GOOD = 0.1

interface ShiftWindow extends Window {
  __shift: number
}

test.describe('layout shift on a direct visit', () => {
  for (const [name, viewport] of [
    ['desktop', { width: 1280, height: 800 }],
    ['phone', { width: 390, height: 844 }],
  ] as const) {
    test(`a lazy page does not push the footer, ${name}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.route('**/assets/*.js', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
        await route.continue()
      })
      await page.addInitScript(() => {
        const state = { __shift: 0 }
        Object.defineProperty(window, '__shift', { get: () => state.__shift })
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as {
            hadRecentInput: boolean
            value: number
          }[]) {
            if (!entry.hadRecentInput) state.__shift += entry.value
          }
        }).observe({ type: 'layout-shift', buffered: true })
      })

      await page.goto('/about')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      // Shifts are reported a moment after the frame that caused them.
      await page.waitForTimeout(500)

      const shift = await page.evaluate(() => (window as unknown as ShiftWindow).__shift)
      expect(shift).toBeLessThan(GOOD)
    })
  }
})

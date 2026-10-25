import { expect, test as base, type BrowserContext, type Locator } from '@playwright/test'

// Every spec imports `test` and `expect` from here, not from '@playwright/test' (ESLint enforces
// it). The site makes no request to anyone else, so a test that did would depend on a server this
// repository does not control. The guard below refuses such a request and fails the test.

export interface NetworkGuard {
  /** The URLs the page asked for outside the site's own origin, in the order it asked. */
  readonly blocked: string[]
}

/**
 * Refuses every http(s) request to an origin other than `baseURL`'s, and records it. `data:` and
 * `blob:` URLs never leave the page, so they are not matched. A context a test opens itself with
 * `browser.newContext()` is not covered unless it is passed here.
 */
export async function guardNetwork(
  context: BrowserContext,
  baseURL: string,
): Promise<NetworkGuard> {
  const origin = new URL(baseURL).origin
  const blocked: string[] = []
  await context.route(
    (url) => (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin,
    async (route) => {
      blocked.push(route.request().url())
      await route.abort('blockedbyclient')
    },
  )
  return { blocked }
}

/** Marks a test that is meant to make a blocked request (the guard's own tests). */
export const EXPECTS_BLOCKED = 'expects-blocked'

export const test = base.extend<{ network: NetworkGuard }>({
  network: [
    // The callback is not named `use`, which eslint-plugin-react-hooks reads as React's `use`.
    async ({ context, baseURL }, provide, testInfo) => {
      if (baseURL === undefined) throw new Error('playwright.config.ts must set use.baseURL')
      const guard = await guardNetwork(context, baseURL)
      await provide(guard)
      if (!testInfo.annotations.some((annotation) => annotation.type === EXPECTS_BLOCKED)) {
        expect(guard.blocked, 'requests to somewhere other than the site itself').toEqual([])
      }
    },
    { auto: true },
  ],
})

export { expect }

/**
 * True where a browser without WebGL2 must fail a run instead of skipping tests: on CI, which runs
 * Chromium and so can create a context. A developer's machine may not, and skips.
 */
export const requireWebgl = Boolean(process.env.CI)

/**
 * Call once the page shows either its live WebGL view or its "unavailable" state. Where WebGL2 is
 * required (CI) the unavailable state is a failure; elsewhere the test is skipped, so a skip shows
 * in the report rather than a pass.
 */
export async function skipWithoutWebgl(unavailable: Locator, reason: string): Promise<void> {
  if (requireWebgl) {
    await expect(unavailable, `${reason} CI is expected to provide WebGL2.`).toBeHidden()
    return
  }
  test.skip(await unavailable.isVisible(), reason)
}

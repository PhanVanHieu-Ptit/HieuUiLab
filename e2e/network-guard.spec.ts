import type { Page } from '@playwright/test'

import { EXPECTS_BLOCKED, expect, test } from './fixtures'

// The guard in fixtures.ts is what lets every other spec say "the site asks nobody else for
// anything" without repeating it. These two tests show that it refuses a request, and that a test
// that makes one fails. `.invalid` is a name no resolver answers, and the guard refuses the request
// before the browser would look it up.

const OUTSIDE = 'https://example.invalid/api/data.json'

function fetchOutcome(page: Page, url: string): Promise<string> {
  return page.evaluate(
    (target) =>
      fetch(target).then(
        (response) => `status ${String(response.status)}`,
        () => 'refused',
      ),
    url,
  )
}

test('refuses a request to another origin, records it, and leaves the site and data URLs alone', async ({
  page,
  network,
}) => {
  test.info().annotations.push({ type: EXPECTS_BLOCKED })
  await page.goto('/')

  expect(await fetchOutcome(page, OUTSIDE)).toBe('refused')
  expect(network.blocked).toEqual([OUTSIDE])

  expect(await fetchOutcome(page, '/')).toBe('status 200')
  expect(await fetchOutcome(page, 'data:text/plain,hello')).toBe('status 200')
  expect(network.blocked).toEqual([OUTSIDE])
})

test('fails a test that asks another origin for something', async ({ page }) => {
  // Without the annotation above, the fixture asserts nothing was blocked when the test ends. A
  // test that is expected to fail passes only if that assertion fires, so this one goes red if the
  // guard stops working.
  test.fail()
  await page.goto('/')
  expect(await fetchOutcome(page, OUTSIDE)).toBe('refused')
})

import { expect, test } from './fixtures'

// Every link that leaves the site must be safe in production: https, never to the machine the
// site was built on, and opened with `rel="noreferrer"` or `"noopener"` so the other page cannot
// reach back through `window.opener`. This reads the links as a visitor's browser sees them, on
// the pages that carry the most, in the production build or on a deployment. It does not follow
// them: whether the other site is up is `pnpm deploy:links`, and the network guard would refuse.
const pages = [
  '/',
  '/about',
  '/projects',
  '/projects/hieu-ui-lab-platform',
  '/docs',
  '/docs/map-viewer',
  '/docs/deployment',
]

interface ExternalLink {
  href: string
  rel: string
  target: string
  text: string
}

for (const path of pages) {
  test(`${path}: every link to another site is https and has a safe rel`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    // Lazy sections and highlighted code finish rendering before the links are read.
    await page.waitForLoadState('networkidle')

    const links = await page.evaluate((): ExternalLink[] => {
      // An icon-only link is named by its aria-label.
      const textOf = (a: HTMLAnchorElement) => {
        const text = a.textContent.trim()
        return text === '' ? (a.getAttribute('aria-label') ?? '') : text
      }
      return [...document.querySelectorAll<HTMLAnchorElement>('a[href]')]
        .filter((a) => /^https?:\/\//.test(a.href) && new URL(a.href).origin !== location.origin)
        .map((a) => ({
          href: a.href,
          rel: a.rel,
          target: a.target,
          text: textOf(a),
        }))
    })

    const problems = links.flatMap((link) => {
      const url = new URL(link.href)
      return [
        ...(url.protocol === 'https:' ? [] : [`${link.href} is not https`]),
        ...(/^(?:localhost|127\.|\[::1\]|0\.0\.0\.0)/.test(url.host)
          ? [`${link.href} points at the local machine`]
          : []),
        ...(/\b(?:noreferrer|noopener)\b/.test(link.rel)
          ? []
          : [`${link.href} ("${link.text}") has rel="${link.rel}"`]),
        ...(link.target === '_blank'
          ? []
          : [`${link.href} ("${link.text}") opens in the same tab`]),
      ]
    })
    expect(problems).toEqual([])
  })
}

test('the home page and the footer link to the repository and the author', async ({ page }) => {
  await page.goto('/')
  const hrefs = await page
    .locator('a[href^="https://github.com/PhanVanHieu-Ptit"]')
    .evaluateAll((anchors) => anchors.map((a) => (a as HTMLAnchorElement).href))
  expect(hrefs).toContain('https://github.com/PhanVanHieu-Ptit/HieuUiLab')
  expect(hrefs).toContain('https://github.com/PhanVanHieu-Ptit')
})

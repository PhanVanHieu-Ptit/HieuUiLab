import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

// axe-core runs in the page, so it sees the real DOM, computed styles, and the colors the browser
// painted, which jsdom cannot give. It finds violations of its rules; a clean scan does not mean a
// page is accessible, only that these rules found nothing in the state that was scanned.

/**
 * WCAG 2.0 and 2.1, levels A and AA. axe's "best-practice" rules and the WCAG 2.2 rules are not in
 * this set, and no rule is switched off.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const

type Analysis = Awaited<ReturnType<AxeBuilder['analyze']>>
export type Violation = Analysis['violations'][number]

export interface Scope {
  /** Limit the scan to these selectors. Everything is scanned when empty. */
  include?: readonly string[]
  /** Leave these out. Only for the inside of a third-party widget, with the reason written beside it. */
  exclude?: readonly string[]
  /**
   * Switch rules off for this scan. Only where axe cannot see what makes the page correct, with the
   * reason written beside it and a test of the behavior the rule exists to protect.
   */
  disableRules?: readonly string[]
}

export async function scan(
  page: Page,
  scope: Scope = {},
): Promise<{ violations: Violation[]; incomplete: Violation[] }> {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS])
  for (const selector of scope.include ?? []) builder = builder.include(selector)
  for (const selector of scope.exclude ?? []) builder = builder.exclude(selector)
  if (scope.disableRules?.length) builder = builder.disableRules([...scope.disableRules])
  const { violations, incomplete } = await builder.analyze()
  return { violations, incomplete }
}

type Node = Violation['nodes'][number]

/** For a color-contrast node: the measured colors and the ratio, so the failure can be acted on. */
function contrastNote(node: Node): string {
  const data: unknown = node.any[0]?.data
  if (typeof data !== 'object' || data === null || !('contrastRatio' in data)) return ''
  const { fgColor, bgColor, contrastRatio, expectedContrastRatio } = data as Record<string, unknown>
  return `  [${String(fgColor)} on ${String(bgColor)} = ${String(contrastRatio)}:1, needs ${String(expectedContrastRatio)}]`
}

export function describe(violations: readonly Violation[]): string {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => `    ${node.target.flat().join(' ')}${contrastNote(node)}`)
        .join('\n')
      return `${violation.id} (${violation.impact ?? 'no impact given'}): ${violation.help}\n  ${violation.helpUrl}\n${nodes}`
    })
    .join('\n')
}

/**
 * Fails with every violation, its selector, and its help link. What axe could not decide (for
 * example a color over an image) is not a pass or a failure; it is listed on the test, so a person
 * can look.
 */
export async function expectNoViolations(page: Page, scope: Scope = {}): Promise<void> {
  const { violations, incomplete } = await scan(page, scope)
  if (incomplete.length > 0) {
    test.info().annotations.push({
      type: 'axe-needs-review',
      description: incomplete.map((item) => `${item.id} (${String(item.nodes.length)})`).join(', '),
    })
  }
  // The count, not the objects: the message below is the readable version of the same list.
  expect(
    violations.length,
    `${String(violations.length)} accessibility violation(s):\n${describe(violations)}`,
  ).toBe(0)
}

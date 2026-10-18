import { beforeAll, describe, expect, it } from 'vitest'

import { createDocsContext } from '@/test/docs-context'

import { validateDocs, type DocsContext } from './docs-rules'
import { docNodes } from './manifest'

let context: DocsContext

beforeAll(async () => {
  context = await createDocsContext()
})

// The documentation is checked against the repository: its links, its code samples' imports, the
// files and registry entries it names, and the files it lists. Run it alone with `pnpm docs:check`.
describe('the documentation', () => {
  it('follows every docs rule', () => {
    expect(validateDocs(context)).toEqual([])
  })

  it('has a page loaded for every page in the manifest', () => {
    expect(context.pages.map(({ node }) => node.entry.id)).toEqual(
      docNodes.map((node) => node.entry.id),
    )
  })
})

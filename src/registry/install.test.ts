import { describe, expect, it } from 'vitest'

import { getRegistryEntry } from '@/registry'
import { fullRegistry } from '@/test/full-registry'

import { resolveInstallPlan } from './install'
import { registryRequirements, type RequirementId } from './packages'
import { isImplemented } from './types'

const implemented = fullRegistry.filter(isImplemented)
const order = Object.keys(registryRequirements)

describe('the install plan of every implemented entry', () => {
  it.each(implemented.map((entry) => [entry.slug, entry] as const))(
    '%s asks for the setup of everything it copies',
    (_slug, entry) => {
      const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
      const copied = [...plan.entries, entry]

      for (const member of copied) {
        for (const id of member.installation.requirements) {
          expect(
            plan.requirements,
            `${entry.slug} copies ${member.slug}, which needs ${id}`,
          ).toContain(id)
        }
      }
      // Entries are listed in the order of registryRequirements, so a page reads the same way each time.
      const positions = plan.requirements.map((id) => order.indexOf(id))
      expect(positions).toEqual([...positions].sort((a, b) => a - b))
      expect(new Set(plan.requirements).size).toBe(plan.requirements.length)
    },
  )

  it('asks for the cn helper whenever a copied source imports it', () => {
    const sources = new Map(implemented.map((entry) => [entry.slug, entry.source]))
    const cnHelper: RequirementId = 'cn-helper'
    for (const entry of implemented) {
      const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
      const importsCn = [...plan.entries, entry].some((member) =>
        sources.get(member.slug)?.includes("from '@/lib/cn'"),
      )
      if (importsCn) expect(plan.requirements, entry.slug).toContain(cnHelper)
    }
  })

  it('reaches the cn helper through a dependency for Error state, which declares only the tokens', () => {
    const entry = implemented.find((each) => each.slug === 'error-state')
    expect(entry?.installation.requirements).toEqual(['design-tokens'])
    if (!entry) return
    const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
    expect(plan.requirements).toEqual(['cn-helper', 'design-tokens', 'state-utilities'])
  })
})

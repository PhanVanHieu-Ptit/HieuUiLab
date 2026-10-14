import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

import packageJsonSource from '../../package.json?raw'
import { getImplementedEntry, getRegistryEntry, registry, registryHref } from '.'
import { resolveInstallPlan } from './install'
import { registryPackages } from './packages'
import { isImplemented } from './types'

const { dependencies } = JSON.parse(packageJsonSource) as { dependencies: Record<string, string> }

describe('every published entry', () => {
  it.each(registry.map((entry) => [registryHref(entry), entry] as const))(
    '%s resolves to its detail page',
    async (href, entry) => {
      const { router } = await renderRoute(href)
      expect(router.state.location.pathname).toBe(href)
      expect(screen.getByRole('heading', { level: 1, name: entry.name })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Page not found' })).toBeNull()
    },
  )
})

describe('planned entries', () => {
  const planned = registry.filter((entry) => !isImplemented(entry))

  it.each(planned.map((entry) => [registryHref(entry), entry] as const))(
    '%s is never presented as implemented',
    async (href, entry) => {
      await renderRoute(href)
      // The status badge sits next to the h1.
      const titleRow = screen.getByRole('heading', { level: 1, name: entry.name }).parentElement
      expect(titleRow).not.toBeNull()
      if (titleRow) expect(within(titleRow).getByText('Planned')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Not implemented yet' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Installation' })).toBeNull()
      expect(screen.queryByRole('heading', { name: 'Examples' })).toBeNull()
      expect(screen.queryByRole('tab', { name: 'Code' })).toBeNull()
      await waitFor(() => {
        expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull()
      })
    },
  )
})

describe('installation data', () => {
  it('names only packages this project depends on', () => {
    for (const name of Object.keys(registryPackages)) {
      expect(dependencies, name).toHaveProperty(name)
    }
  })

  it('resolves registry dependencies transitively, dependencies first', () => {
    const entry = getImplementedEntry('resource-list')
    expect(entry).toBeDefined()
    if (!entry) return
    const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
    expect(plan.entries.map((dependency) => dependency.slug)).toEqual([
      'empty-state',
      'button',
      'skeleton',
    ])
    // Button's own packages and the cn helper's are included.
    expect(plan.packages).toEqual([
      'class-variance-authority',
      'clsx',
      'lucide-react',
      'radix-ui',
      'tailwind-merge',
    ])
  })

  it('does not resolve a planned entry as implemented', () => {
    expect(getImplementedEntry('tooltip')).toBeUndefined()
    expect(getRegistryEntry('tooltip')?.status).toBe('planned')
  })
})

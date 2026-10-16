import { render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRoute } from '@/test/render'

import packageJsonSource from '../../package.json?raw'
import { getImplementedEntry, getRegistryEntry, registry, registryHref } from '.'
import { resolveInstallPlan } from './install'
import { packageVersion, registryPackages } from './packages'
import { defaultPlaygroundValues, resolvePlaygroundProps } from './playground'
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

describe('URL slugs', () => {
  // Slugs are public URLs. Renaming one breaks links, so it must be a deliberate
  // change here, together with a redirect from the old URL.
  it('stay stable', () => {
    expect(registry.map(registryHref)).toMatchInlineSnapshot(`
      [
        "/blocks/activity-list",
        "/components/alert",
        "/components/badge",
        "/components/breadcrumb",
        "/components/button",
        "/components/card",
        "/components/checkbox",
        "/components/combobox",
        "/blocks/confirm-action",
        "/blocks/crud-management-page",
        "/blocks/dashboard-overview",
        "/blocks/data-table",
        "/blocks/data-toolbar",
        "/blocks/detail-panel",
        "/components/dialog",
        "/blocks/empty-state",
        "/blocks/error-state",
        "/components/field",
        "/components/form",
        "/components/form-feedback",
        "/components/input",
        "/components/kbd",
        "/components/label",
        "/components/metric-card",
        "/blocks/monitoring-dashboard",
        "/blocks/multi-step-onboarding",
        "/blocks/notification-center",
        "/components/notification-item",
        "/blocks/orders-dashboard",
        "/components/pagination",
        "/components/password-input",
        "/blocks/profile-form",
        "/blocks/resource-list",
        "/blocks/search-filter-form",
        "/blocks/search-filter-toolbar",
        "/components/search-input",
        "/components/select",
        "/components/separator",
        "/components/sheet",
        "/blocks/sign-in-page",
        "/components/skeleton",
        "/components/sparkline",
        "/components/spinner",
        "/components/status-badge",
        "/components/switch",
        "/components/table",
        "/components/tabs",
        "/components/textarea",
        "/components/tooltip",
        "/blocks/user-profile-settings",
      ]
    `)
  })
})

describe('playgrounds', () => {
  const withPlayground = registry.filter(isImplemented).filter((entry) => entry.playground)

  it('exist for the entries that support them', () => {
    expect(withPlayground.map((entry) => entry.slug)).toEqual([
      'badge',
      'button',
      'checkbox',
      'input',
      'spinner',
      'status-badge',
      'switch',
      'textarea',
    ])
  })

  it.each(withPlayground.map((entry) => [entry.slug, entry] as const))(
    '%s renders its default props',
    (_slug, entry) => {
      const { playground } = entry
      if (!playground) return
      const Component = playground.component
      const props = resolvePlaygroundProps(playground, defaultPlaygroundValues(playground))
      const { container } = render(<Component {...Object.fromEntries(props)} />)
      expect(container.firstElementChild).not.toBeNull()
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
  it('names only packages this project depends on, with their version ranges', () => {
    for (const name of Object.keys(registryPackages) as (keyof typeof registryPackages)[]) {
      expect(dependencies, name).toHaveProperty(name)
      expect(packageVersion(name)).toBe(dependencies[name])
    }
  })

  it('resolves registry dependencies transitively, dependencies first', () => {
    const entry = getImplementedEntry('resource-list')
    expect(entry).toBeDefined()
    if (!entry) return
    const plan = resolveInstallPlan(entry, (slug) => getRegistryEntry(slug))
    // Button arrives through Error state, before Error state itself.
    expect(plan.entries.map((dependency) => dependency.slug)).toEqual([
      'empty-state',
      'button',
      'error-state',
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
    expect(getImplementedEntry('combobox')).toBeUndefined()
    expect(getRegistryEntry('combobox')?.status).toBe('planned')
  })
})

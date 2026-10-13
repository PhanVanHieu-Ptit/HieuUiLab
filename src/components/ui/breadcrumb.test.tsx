import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './breadcrumb'

describe('Breadcrumb', () => {
  it('renders a labelled ordered trail with the current page marked', () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Theming</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    )
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' })
    // The separator is presentational, so only the two real items are list items.
    expect(within(nav).getAllByRole('listitem')).toHaveLength(2)
    expect(within(nav).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs')
    expect(within(nav).getByText('Theming')).toHaveAttribute('aria-current', 'page')
  })

  it('accepts a custom label', () => {
    render(<Breadcrumb aria-label="You are here" />)
    expect(screen.getByRole('navigation', { name: 'You are here' })).toBeInTheDocument()
  })
})

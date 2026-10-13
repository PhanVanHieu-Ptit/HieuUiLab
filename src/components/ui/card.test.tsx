import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from './card'

describe('Card', () => {
  it('composes its parts with a configurable heading level', () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle as="h2">Usage</CardTitle>
          <CardDescription>Monthly totals</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Usage' })).toBeInTheDocument()
    expect(screen.getByTestId('card')).toHaveClass('bg-surface', 'border')
    expect(screen.getByText('Monthly totals')).toHaveClass('text-muted-foreground')
  })

  it('defaults CardTitle to h3', () => {
    render(<CardTitle>Title</CardTitle>)
    expect(screen.getByRole('heading', { level: 3, name: 'Title' })).toBeInTheDocument()
  })

  it('stretches CardLink over an interactive card', () => {
    render(
      <Card variant="interactive" data-testid="card">
        <CardTitle>
          <CardLink href="/docs">Docs</CardLink>
        </CardTitle>
      </Card>,
    )
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('data-card-link')
    expect(link).toHaveClass('after:absolute', 'after:inset-0')
    expect(screen.getByTestId('card')).toHaveClass('relative')
  })

  it('merges CardLink onto a child with asChild', () => {
    render(
      <CardLink asChild>
        <button type="button">Open</button>
      </CardLink>,
    )
    expect(screen.getByRole('button', { name: 'Open' })).toHaveAttribute('data-card-link')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

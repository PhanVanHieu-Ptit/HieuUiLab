import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

function Example({ variant }: { variant?: 'line' | 'pill' }) {
  return (
    <Tabs defaultValue="a" {...(variant ? { variant } : {})}>
      <TabsList aria-label="Sections">
        <TabsTrigger value="a">Alpha</TabsTrigger>
        <TabsTrigger value="b" disabled>
          Beta
        </TabsTrigger>
        <TabsTrigger value="c">Gamma</TabsTrigger>
      </TabsList>
      <TabsContent value="a">Alpha panel</TabsContent>
      <TabsContent value="c">Gamma panel</TabsContent>
    </Tabs>
  )
}

describe('Tabs', () => {
  it('exposes a labelled tablist with the default tab selected', () => {
    render(<Example />)
    expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel', { name: 'Alpha' })).toHaveTextContent('Alpha panel')
  })

  it('moves with arrow keys and skips disabled tabs', async () => {
    const user = userEvent.setup()
    render(<Example />)
    await user.click(screen.getByRole('tab', { name: 'Alpha' }))
    await user.keyboard('{ArrowRight}')

    const gamma = screen.getByRole('tab', { name: 'Gamma' })
    expect(gamma).toHaveFocus()
    expect(gamma).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Gamma panel')
  })

  it('applies the variant to the list and triggers', () => {
    render(<Example variant="pill" />)
    expect(screen.getByRole('tablist')).toHaveClass('bg-muted')
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveClass('rounded-sm')
  })
})

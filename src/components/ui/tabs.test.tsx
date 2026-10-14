import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
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

  it('follows a controlled value set from outside the tabs', async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [value, setValue] = useState('a')
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setValue('c')
            }}
          >
            Show gamma
          </button>
          <Tabs value={value} onValueChange={setValue}>
            <TabsList aria-label="Sections">
              <TabsTrigger value="a">Alpha</TabsTrigger>
              <TabsTrigger value="c">Gamma</TabsTrigger>
            </TabsList>
            <TabsContent value="a">Alpha panel</TabsContent>
            <TabsContent value="c">Gamma panel</TabsContent>
          </Tabs>
        </>
      )
    }
    render(<Controlled />)
    await user.click(screen.getByRole('button', { name: 'Show gamma' }))
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'true')

    await user.click(screen.getByRole('tab', { name: 'Gamma' }))
    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Alpha panel')
  })

  it('moves focus without selecting in manual activation mode', async () => {
    const user = userEvent.setup()
    render(
      <Tabs defaultValue="a" activationMode="manual">
        <TabsList aria-label="Sections">
          <TabsTrigger value="a">Alpha</TabsTrigger>
          <TabsTrigger value="c">Gamma</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Alpha panel</TabsContent>
        <TabsContent value="c">Gamma panel</TabsContent>
      </Tabs>,
    )
    await user.click(screen.getByRole('tab', { name: 'Alpha' }))
    await user.keyboard('{ArrowRight}')
    const gamma = screen.getByRole('tab', { name: 'Gamma' })
    expect(gamma).toHaveFocus()
    expect(gamma).toHaveAttribute('aria-selected', 'false')
    await user.keyboard('{Enter}')
    expect(gamma).toHaveAttribute('aria-selected', 'true')
  })
})

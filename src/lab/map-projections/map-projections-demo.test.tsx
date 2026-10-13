import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { MapProjectionsDemo } from './map-projections-demo'

describe('MapProjectionsDemo', () => {
  it('starts on the orthographic globe with labelled rotation controls', () => {
    render(<MapProjectionsDemo />)

    expect(screen.getByRole('tab', { name: 'Orthographic' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('img', { name: /Orthographic projection/ })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Centre longitude' })).toHaveValue('105')
  })

  it('updates which cities face the viewer as the globe turns', () => {
    render(<MapProjectionsDemo />)
    const table = screen.getByRole('table', { name: 'Cities and whether they face the viewer' })
    const newYork = () => within(table).getByRole('row', { name: /New York/ })
    expect(newYork()).toHaveTextContent('No')

    fireEvent.change(screen.getByRole('slider', { name: 'Centre longitude' }), {
      target: { value: '-75' },
    })

    expect(newYork()).toHaveTextContent('Yes')
  })

  it('switches projections and shows their scale factors', async () => {
    const user = userEvent.setup()
    render(<MapProjectionsDemo />)

    await user.click(screen.getByRole('tab', { name: 'Web Mercator' }))

    expect(screen.getByRole('img', { name: /Web Mercator projection/ })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Cities and their Mercator scale factor' })
    // sec(64.15°) ≈ 2.29 for Reykjavík.
    expect(within(table).getByRole('row', { name: /Reykjavík/ })).toHaveTextContent('×2.29')
  })
})

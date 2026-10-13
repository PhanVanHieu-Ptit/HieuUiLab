import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Separator } from './separator'

describe('Separator', () => {
  it('is decorative and horizontal by default', () => {
    const { container } = render(<Separator />)
    const element = container.firstElementChild
    expect(element).toHaveAttribute('role', 'none')
    expect(element).toHaveAttribute('data-orientation', 'horizontal')
  })

  it('exposes a semantic vertical separator when not decorative', () => {
    render(<Separator orientation="vertical" decorative={false} />)
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical')
  })
})

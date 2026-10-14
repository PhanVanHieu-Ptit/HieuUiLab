import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FormFeedback } from './form-feedback'

describe('FormFeedback', () => {
  it('announces success politely and takes focus', () => {
    render(
      <FormFeedback status="success" title="Profile saved">
        Your team can see it.
      </FormFeedback>,
    )

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Profile saved')
    expect(status).toHaveTextContent('Your team can see it.')
    expect(status).toHaveFocus()
    expect(status).toHaveAttribute('tabindex', '-1')
  })

  it('announces errors at once', () => {
    render(<FormFeedback status="error" title="Not saved" focusOnMount={false} />)

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Not saved')
    expect(alert).not.toHaveFocus()
  })

  it('takes focus again when remounted with a new key', () => {
    const { rerender } = render(
      <>
        <button type="button">Elsewhere</button>
        <FormFeedback key={1} status="error" title="Not saved" />
      </>,
    )
    screen.getByRole('button', { name: 'Elsewhere' }).focus()

    rerender(
      <>
        <button type="button">Elsewhere</button>
        <FormFeedback key={2} status="error" title="Not saved" />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveFocus()
  })
})

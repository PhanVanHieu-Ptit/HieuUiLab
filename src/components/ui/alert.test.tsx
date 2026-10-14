import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert, AlertDescription, AlertTitle } from './alert'

describe('Alert', () => {
  it('is a polite status by default with a title and description', () => {
    render(
      <Alert>
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes are live.</AlertDescription>
      </Alert>,
    )
    const alert = screen.getByRole('status')
    expect(alert).toHaveTextContent('Saved')
    expect(alert).toHaveTextContent('Your changes are live.')
  })

  it('interrupts with role="alert" for destructive messages', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Payment failed</AlertTitle>
      </Alert>,
    )
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('border-destructive/40')
    expect(screen.getByText('Payment failed')).toHaveAttribute('data-slot', 'alert-title')
  })

  it('lets the role be overridden for messages that should not be announced', () => {
    render(
      <Alert variant="warning" role="none" data-testid="alert">
        <AlertTitle>Deprecated</AlertTitle>
      </Alert>,
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByTestId('alert')).toHaveAttribute('role', 'none')
  })

  it('merges className and passes native attributes', () => {
    render(<Alert variant="info" className="max-w-md" aria-label="Notice" />)
    expect(screen.getByRole('status', { name: 'Notice' })).toHaveClass('max-w-md', 'border-info/40')
  })
})

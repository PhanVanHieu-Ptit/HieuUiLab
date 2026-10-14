import { useState } from 'react'

import { ErrorState } from '@/components/blocks/error-state'
import { Button } from '@/components/ui/button'

export function ErrorStateDemo() {
  const [attempts, setAttempts] = useState(0)

  return (
    <ErrorState
      className="w-full max-w-md"
      title="Couldn’t load invoices"
      description={
        attempts === 0
          ? 'The billing service did not respond.'
          : `Still not responding after ${String(attempts)} ${attempts === 1 ? 'retry' : 'retries'}.`
      }
      onRetry={() => {
        setAttempts((count) => count + 1)
      }}
      actions={
        <Button variant="ghost" size="sm">
          Show last saved copy
        </Button>
      }
    />
  )
}

export function ErrorStatePlainDemo() {
  return (
    <ErrorState
      className="w-full max-w-md"
      title="This report is no longer available"
      description="Reports are kept for 90 days. Generate a new one from the Reports page."
    />
  )
}

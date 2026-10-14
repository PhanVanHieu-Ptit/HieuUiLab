import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function AlertVariantsDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert role="none">
        <Info aria-hidden="true" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>Components are copied into your project, not installed.</AlertDescription>
      </Alert>
      <Alert variant="info" role="none">
        <Info aria-hidden="true" />
        <AlertTitle>Info: new release</AlertTitle>
        <AlertDescription>Select and Tooltip are now stable.</AlertDescription>
      </Alert>
      <Alert variant="success" role="none">
        <CircleCheck aria-hidden="true" />
        <AlertTitle>Success: deployed</AlertTitle>
        <AlertDescription>The preview is live.</AlertDescription>
      </Alert>
      <Alert variant="warning" role="none">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Warning: deprecated prop</AlertTitle>
        <AlertDescription>
          <code className="font-mono">beta</code> is now{' '}
          <code className="font-mono">experimental</code>.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive" role="none">
        <CircleX aria-hidden="true" />
        <AlertTitle>Error: build failed</AlertTitle>
        <AlertDescription>Type check found 2 errors.</AlertDescription>
      </Alert>
    </div>
  )
}

export function AlertLiveDemo() {
  const [result, setResult] = useState<'saved' | 'failed' | null>(null)

  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setResult('saved')
          }}
        >
          Save draft
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setResult('failed')
          }}
        >
          Publish (fails)
        </Button>
      </div>
      {result === 'saved' ? (
        <Alert variant="success">
          <CircleCheck aria-hidden="true" />
          <AlertTitle>Draft saved</AlertTitle>
          <AlertDescription>Announced politely, after the screen reader finishes.</AlertDescription>
        </Alert>
      ) : null}
      {result === 'failed' ? (
        <Alert variant="destructive">
          <CircleX aria-hidden="true" />
          <AlertTitle>Could not publish</AlertTitle>
          <AlertDescription>Announced immediately with role=&quot;alert&quot;.</AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}

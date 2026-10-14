import { ConfirmAction } from '@/components/blocks/confirm-action'
import { Button } from '@/components/ui/button'

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

export function ConfirmActionDemo() {
  return (
    <ConfirmAction
      trigger={<Button variant="outline">Remove saved view</Button>}
      title="Remove “Open issues”?"
      description="The view is removed for everyone on the team. The issues themselves are not affected."
      confirmLabel="Remove view"
      onConfirm={() => wait(800)}
    />
  )
}

export function ConfirmActionFailureDemo() {
  return (
    <ConfirmAction
      trigger={<Button variant="outline">Revoke access token</Button>}
      title="Revoke this token?"
      description="Scripts using it stop working immediately."
      confirmLabel="Revoke token"
      onConfirm={async () => {
        await wait(800)
        throw new Error('The server did not respond. Nothing was revoked; try again.')
      }}
    />
  )
}

export function ConfirmActionDefaultDemo() {
  return (
    <ConfirmAction
      trigger={<Button>Publish changes</Button>}
      title="Publish 4 changes?"
      description="The changes go live for every visitor. You can roll back from the history page."
      confirmLabel="Publish"
      confirmVariant="default"
      onConfirm={() => wait(800)}
    />
  )
}

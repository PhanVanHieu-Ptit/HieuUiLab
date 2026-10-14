import { useState } from 'react'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function SwitchDemo() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Switch id="switch-autosave" defaultChecked />
        <Label htmlFor="switch-autosave">Autosave</Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="switch-compact" size="sm" />
        <Label htmlFor="switch-compact" className="text-xs">
          Compact rows (small)
        </Label>
      </div>
      <div className="flex items-center gap-3">
        <Switch id="switch-sync" disabled />
        <Label htmlFor="switch-sync">Cloud sync (disabled)</Label>
      </div>
    </div>
  )
}

export function SwitchControlledDemo() {
  const [digest, setDigest] = useState(false)

  return (
    <div className="flex w-full max-w-sm items-start justify-between gap-6 rounded-lg border p-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="switch-digest">Weekly digest</Label>
        <p id="switch-digest-hint" className="text-xs text-muted-foreground">
          {digest ? 'A summary arrives every Monday.' : 'No summary emails.'}
        </p>
      </div>
      <Switch
        id="switch-digest"
        aria-describedby="switch-digest-hint"
        checked={digest}
        onCheckedChange={setDigest}
      />
    </div>
  )
}

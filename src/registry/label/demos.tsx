import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LabelDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="label-project" required>
        Project name
      </Label>
      <Input id="label-project" required placeholder="hieu-ui-lab" />
    </div>
  )
}

export function LabelControlsDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="label-updates" defaultChecked />
        <Label htmlFor="label-updates">Email me about updates</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="label-beta" disabled />
        <Label htmlFor="label-beta">Beta features (unavailable)</Label>
      </div>
    </div>
  )
}

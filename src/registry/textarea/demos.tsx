import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function TextareaDemo() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <Label htmlFor="textarea-feedback">Feedback</Label>
      <Textarea
        id="textarea-feedback"
        placeholder="What worked, and what didn’t?"
        aria-describedby="textarea-feedback-hint"
      />
      <p id="textarea-feedback-hint" className="text-xs text-muted-foreground">
        The box grows as you type.
      </p>
    </div>
  )
}

export function TextareaStatesDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="textarea-small">Small</Label>
        <Textarea id="textarea-small" size="sm" defaultValue="A compact note." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="textarea-readonly">Read-only</Label>
        <Textarea id="textarea-readonly" readOnly defaultValue="Generated from the release log." />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="textarea-disabled">Disabled</Label>
        <Textarea id="textarea-disabled" disabled defaultValue="Comments are closed." />
      </div>
    </div>
  )
}

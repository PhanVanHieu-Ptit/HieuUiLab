import { useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export function CheckboxDemo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-terms" />
        <Label htmlFor="checkbox-terms">Accept the license terms</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-small" size="sm" defaultChecked />
        <Label htmlFor="checkbox-small" className="text-xs">
          Small, checked by default
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="checkbox-disabled" disabled defaultChecked />
        <Label htmlFor="checkbox-disabled">Disabled</Label>
      </div>
    </div>
  )
}

export function CheckboxSelectAllDemo() {
  const packages = ['radix-ui', 'lucide-react', 'class-variance-authority']
  const [selected, setSelected] = useState<string[]>(['radix-ui'])
  const allChecked =
    selected.length === packages.length ? true : selected.length > 0 ? 'indeterminate' : false

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Packages to install</legend>
      <div className="flex items-center gap-2">
        <Checkbox
          id="checkbox-all"
          checked={allChecked}
          onCheckedChange={(checked) => {
            setSelected(checked === true ? [...packages] : [])
          }}
        />
        <Label htmlFor="checkbox-all">All packages</Label>
      </div>
      <div className="flex flex-col gap-3 border-l pl-6">
        {packages.map((name) => (
          <div key={name} className="flex items-center gap-2">
            <Checkbox
              id={`checkbox-${name}`}
              checked={selected.includes(name)}
              onCheckedChange={(checked) => {
                setSelected((current) =>
                  checked === true ? [...current, name] : current.filter((item) => item !== name),
                )
              }}
            />
            <Label htmlFor={`checkbox-${name}`} className="font-mono text-xs">
              {name}
            </Label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}

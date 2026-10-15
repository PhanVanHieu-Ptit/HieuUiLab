import { useId } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { nativeFieldClass } from '@/components/site/native-field'

import {
  checkNumberDraft,
  checkStringDraft,
  describeNumberRange,
  type ControlDef,
  type ControlSchema,
  type ControlValue,
  type ControlValues,
} from '../controls'
import { DraftField } from './draft-field'
import { SegmentedControl } from './segmented-control'

interface ControlFieldProps {
  control: ControlDef
  value: ControlValue | undefined
  onChange: (value: ControlValue) => void
}

/** One control. The value arrives already validated; the field never trusts its own input. */
function ControlField({ control, value, onChange }: ControlFieldProps) {
  const id = useId()

  switch (control.kind) {
    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={id}>{control.label}</Label>
          <Switch
            id={id}
            size="sm"
            checked={value === true}
            onCheckedChange={(checked) => {
              onChange(checked)
            }}
          />
        </div>
      )

    case 'enum': {
      const current = typeof value === 'string' ? value : control.default
      if (control.display === 'segmented') {
        return (
          <SegmentedControl
            legend={control.label}
            options={control.options.map((option) => ({ value: option, label: option }))}
            value={current}
            onChange={onChange}
          />
        )
      }
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{control.label}</Label>
          <select
            id={id}
            value={current}
            onChange={(event) => {
              onChange(event.target.value)
            }}
            className={nativeFieldClass}
          >
            {control.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )
    }

    case 'number':
      return (
        <DraftField
          label={control.label}
          type="number"
          value={typeof value === 'number' ? value : control.default}
          check={(text) => checkNumberDraft(control, text)}
          onCommit={onChange}
          hint={`Enter ${describeNumberRange(control)}.`}
          min={control.min}
          max={control.max}
          step={control.step}
        />
      )

    case 'string': {
      const current = typeof value === 'string' ? value : control.default
      // A required field must not refill its default while it is being retyped.
      if (control.required) {
        return (
          <DraftField
            label={control.label}
            type="text"
            value={current}
            check={(text) => checkStringDraft(control, text)}
            onCommit={onChange}
            maxLength={control.maxLength}
          />
        )
      }
      return (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id}>{control.label}</Label>
          <Input
            id={id}
            value={current}
            autoComplete="off"
            spellCheck={false}
            maxLength={control.maxLength}
            onChange={(event) => {
              onChange(event.target.value)
            }}
          />
        </div>
      )
    }
  }
}

interface ControlPanelProps {
  schema: ControlSchema
  values: ControlValues
  onChange: (key: string, value: ControlValue) => void
}

/** The controls of an example, built from its schema alone. It knows nothing about the preview. */
export function ControlPanel({ schema, values, onChange }: ControlPanelProps) {
  return (
    <form
      aria-label="Example controls"
      onSubmit={(event) => {
        // A lone text field submits on Enter, which would reload the page.
        event.preventDefault()
      }}
      className="flex flex-col gap-4 rounded-lg border p-4"
    >
      {Object.entries(schema).map(([key, control]) => (
        <ControlField
          key={key}
          control={control}
          value={values[key]}
          onChange={(value) => {
            onChange(key, value)
          }}
        />
      ))}
    </form>
  )
}

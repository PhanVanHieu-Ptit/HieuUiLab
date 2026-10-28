import { RotateCcw } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  defaultPlaygroundValues,
  resolvePlaygroundProps,
  type PlaygroundValues,
} from '@/registry/playground'
import type { LoadedEntry, PlaygroundControl, RegistryPlayground } from '@/registry/types'
import { playgroundCode } from '@/registry/usage'

import { CodeBlock } from './code-block'
import { DemoErrorBoundary } from './demo-error-boundary'
import { nativeFieldClass } from './native-field'
import { SectionHeader } from './page'

/** `defaultChecked` → `Default checked`, `aria-invalid` → `Aria invalid`. */
function humanize(prop: string): string {
  const words = prop.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase()
}

interface ControlProps {
  control: PlaygroundControl
  value: PlaygroundValues[string] | undefined
  onChange: (value: string | boolean) => void
}

function Control({ control, value, onChange }: ControlProps) {
  const id = useId()
  const label = control.label ?? humanize(control.prop)

  if (control.kind === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
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
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {control.kind === 'select' ? (
        <select
          id={id}
          value={typeof value === 'string' ? value : control.default}
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
      ) : (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            onChange(event.target.value)
          }}
        />
      )}
    </div>
  )
}

interface PlaygroundProps {
  entry: LoadedEntry
  playground: RegistryPlayground
}

/**
 * Live controls for an entry's main part. The preview renders the real component
 * with the same resolved props the Code tab prints, so what you copy is what you see.
 */
export function Playground({ entry, playground }: PlaygroundProps) {
  const [values, setValues] = useState(() => defaultPlaygroundValues(playground))
  const props = resolvePlaygroundProps(playground, values)
  const changed = playground.controls.some((control) => values[control.prop] !== control.default)
  const Component = playground.component

  return (
    <section aria-labelledby="playground" className="flex flex-col gap-4">
      <SectionHeader
        id="playground"
        title="Playground"
        anchorLabel="Playground"
        description={`Change the props of ${playground.part}. The preview is the real component, and the Code tab always matches it.`}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <Tabs defaultValue="preview" className="min-w-0">
          <TabsList aria-label="Playground">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div
              role="group"
              aria-label={`${playground.part} preview`}
              className="flex min-h-40 items-center justify-center-safe overflow-x-auto rounded-lg border bg-surface p-6 text-surface-foreground sm:p-10"
            >
              {/* Remount on change, so initial-state props such as defaultChecked apply, and a
                  combination of props that throws is left behind when a control changes. */}
              <DemoErrorBoundary key={JSON.stringify(props)}>
                <Component {...Object.fromEntries(props)} />
              </DemoErrorBoundary>
            </div>
          </TabsContent>
          <TabsContent value="code">
            <CodeBlock
              code={playgroundCode(entry, values)}
              title={`${entry.slug}-example.tsx`}
              copyLabel="Copy playground code"
            />
          </TabsContent>
        </Tabs>

        <form
          aria-label="Playground controls"
          onSubmit={(event) => {
            event.preventDefault()
          }}
          className="flex flex-col gap-4 rounded-lg border p-4 lg:mt-12 lg:self-start"
        >
          {playground.controls.map((control) => (
            <Control
              key={control.prop}
              control={control}
              value={values[control.prop]}
              onChange={(value) => {
                setValues((current) => ({ ...current, [control.prop]: value }))
              }}
            />
          ))}
          {changed ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="self-start"
              onClick={() => {
                setValues(defaultPlaygroundValues(playground))
              }}
            >
              <RotateCcw aria-hidden="true" />
              Reset
            </Button>
          ) : null}
        </form>
      </div>
    </section>
  )
}

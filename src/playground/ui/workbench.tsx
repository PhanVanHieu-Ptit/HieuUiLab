import { RotateCcw } from 'lucide-react'
import { useId, useMemo, useReducer } from 'react'
import { Link } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { Button } from '@/components/ui/button'

import type { PlaygroundExample } from '../example'
import {
  initialWorkbenchState,
  reduceWorkbench,
  serializeConfiguration,
  stageThemes,
  stageViewports,
  type WorkbenchAction,
  type WorkbenchState,
} from '../state'
import { ControlPanel } from './control-panel'
import { SegmentedControl } from './segmented-control'
import { StageFrame } from './stage-frame'

const widthOptions = stageViewports.map(({ value, label, width }) => ({
  value,
  label: width === undefined ? label : `${label} ${String(width)}px`,
}))

const subheading = 'text-sm font-semibold'

/**
 * One example with its controls, preview, usage code, and configuration. All of its state is in
 * one reducer, so a parent that gives it a `key` per example discards every part of it, drafts
 * included, when the example changes.
 */
export function Workbench({ example }: { example: PlaygroundExample }) {
  const headingId = useId()
  const [state, dispatch] = useReducer(
    (current: WorkbenchState, action: WorkbenchAction) =>
      reduceWorkbench(example.controls, current, action),
    example.controls,
    initialWorkbenchState,
  )
  const resolved = useMemo(() => example.resolve(state.values), [example, state.values])

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 id={headingId} className="text-heading">
          {example.title}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{example.description}</p>
        {example.docsHref ? (
          <Link
            to={example.docsHref}
            className="w-fit rounded-sm text-sm font-medium underline underline-offset-4 focus-ring"
          >
            {example.title} documentation
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <SegmentedControl
          legend="Preview theme"
          options={stageThemes}
          value={state.theme}
          onChange={(theme) => {
            dispatch({ type: 'theme', theme })
          }}
        />
        <SegmentedControl
          legend="Preview width"
          options={widthOptions}
          value={state.viewport}
          onChange={(viewport) => {
            dispatch({ type: 'viewport', viewport })
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            dispatch({ type: 'reset' })
          }}
        >
          <RotateCcw aria-hidden="true" />
          Reset
        </Button>
        {/* The trailing full stop alternates, so pressing Reset again is announced again. */}
        <p role="status" className="sr-only">
          {state.generation === 0
            ? ''
            : `Reset to the default configuration${state.generation % 2 === 0 ? '.' : ''}`}
        </p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="flex min-w-0 flex-col gap-2">
          <StageFrame
            example={example}
            resolved={resolved}
            theme={state.theme}
            viewport={state.viewport}
            generation={state.generation}
          />
          {example.note ? <p className="text-xs text-muted-foreground">{example.note}</p> : null}
          {state.viewport === 'full' ? null : (
            <p className="text-xs text-muted-foreground">
              Preview width resizes this frame only. Responsive classes such as sm: and md: still
              follow your browser window.
            </p>
          )}
        </div>
        {/* Keyed by generation, so a reset also clears what a field was holding as a draft. */}
        <ControlPanel
          key={state.generation}
          schema={example.controls}
          values={state.values}
          onChange={(key, value) => {
            dispatch({ type: 'set', key, value })
          }}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className={subheading}>Usage example</h3>
        <CodeBlock
          code={resolved.code}
          title={`${example.id}-example.tsx`}
          copyLabel="Copy usage example"
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className={subheading}>Current configuration</h3>
        <CodeBlock
          code={serializeConfiguration(example.id, state)}
          language="text"
          title="configuration.json"
          copyLabel="Copy configuration"
        />
      </div>
    </section>
  )
}

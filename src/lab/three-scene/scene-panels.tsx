import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useId, type ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

import type { CameraMove } from './camera-config'
import { SOLIDS, describeShape, getSolid } from './scene-data'
import type { SceneStats } from './scene-types'

const MOVE_BUTTONS: readonly { move: CameraMove; label: string; icon: ReactNode }[] = [
  { move: 'orbit-left', label: 'Orbit left', icon: <ChevronLeft aria-hidden="true" /> },
  { move: 'orbit-right', label: 'Orbit right', icon: <ChevronRight aria-hidden="true" /> },
  { move: 'raise', label: 'Raise camera', icon: <ChevronUp aria-hidden="true" /> },
  { move: 'lower', label: 'Lower camera', icon: <ChevronDown aria-hidden="true" /> },
  { move: 'zoom-in', label: 'Zoom in', icon: <ZoomIn aria-hidden="true" /> },
  { move: 'zoom-out', label: 'Zoom out', icon: <ZoomOut aria-hidden="true" /> },
]

export interface CameraToolbarProps {
  disabled: boolean
  onMove: (move: CameraMove) => void
  onReset: () => void
}

/**
 * Everything dragging and the wheel can do, as buttons: the keyboard and screen-reader route to
 * moving the camera, within the same limits.
 */
export function CameraToolbar({ disabled, onMove, onReset }: CameraToolbarProps) {
  return (
    <div role="group" aria-label="Camera" className="flex flex-wrap items-center gap-2">
      {MOVE_BUTTONS.map(({ move, label, icon }) => (
        <Button
          key={move}
          variant="outline"
          size="icon"
          aria-label={label}
          title={label}
          disabled={disabled}
          onClick={() => {
            onMove(move)
          }}
        >
          {icon}
        </Button>
      ))}
      <Button variant="outline" size="sm" disabled={disabled} onClick={onReset}>
        <Undo2 aria-hidden="true" />
        Reset camera
      </Button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  )
}

export interface SolidInfoProps {
  selected: string | null
  onClear: () => void
}

/** What is known about the selected solid, read from the scene's data rather than from the renderer. */
export function SolidInfo({ selected, onClear }: SolidInfoProps) {
  const headingId = useId()
  const solid = selected ? getSolid(selected) : undefined
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-lg border bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 id={headingId} className="text-sm font-semibold">
          Selected solid
        </h3>
        {solid ? (
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        ) : null}
      </div>
      {solid ? (
        <>
          <p className="font-medium">{solid.name}</p>
          <Badge size="sm" variant="outline" className="self-start">
            {solid.geometry}
          </Badge>
          <p className="text-sm text-pretty text-muted-foreground">{solid.description}</p>
          <dl className="flex flex-col gap-2">
            <Field label="Size">{describeShape(solid.shape)}</Field>
            <Field label="Position on the ground">
              east {solid.position[0]} m, south {solid.position[1]} m
            </Field>
            <Field label="Identifier">
              <code className="font-mono text-xs">{solid.id}</code>
            </Field>
          </dl>
        </>
      ) : (
        <p className="text-sm text-pretty text-muted-foreground">
          Nothing is selected. Click a solid in the scene, or choose one from the list.
        </p>
      )}
    </section>
  )
}

export interface SolidListProps {
  selected: string | null
  onSelect: (id: string) => void
}

/**
 * Every solid as a button. This is the keyboard and screen-reader route to selecting one, because
 * the canvas itself cannot be focused or read.
 */
export function SolidList({ selected, onSelect }: SolidListProps) {
  const headingId = useId()
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 id={headingId} className="text-sm font-semibold">
        Solids
      </h3>
      <ul className="flex flex-col">
        {SOLIDS.map((solid) => {
          const isSelected = solid.id === selected
          return (
            <li key={solid.id}>
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={isSelected}
                className={cn('w-full justify-between font-normal', isSelected && 'bg-accent')}
                onClick={() => {
                  onSelect(solid.id)
                }}
              >
                <span className="truncate">{solid.name}</span>
                <span className="text-xs text-muted-foreground">{solid.geometry}</span>
              </Button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const STAT_ROWS: readonly { key: keyof SceneStats; label: string }[] = [
  { key: 'drawCalls', label: 'Draw calls in the last frame' },
  { key: 'triangles', label: 'Triangles in the last frame' },
  { key: 'geometries', label: 'Geometries on the GPU' },
  { key: 'textures', label: 'Textures on the GPU' },
  { key: 'frames', label: 'Frames drawn so far' },
]

export interface RendererStatsProps {
  stats: SceneStats | null
}

/**
 * Counters from `renderer.info`. They are counts of what is drawn, not timings, and they are read
 * once each time the scene goes still, so this panel does not re-render while the camera moves.
 */
export function RendererStats({ stats }: RendererStatsProps) {
  return (
    <details className="rounded-lg border p-4 text-sm">
      <summary className="cursor-pointer rounded-sm text-sm font-semibold focus-ring">
        Renderer stats
      </summary>
      <p className="mt-3 text-xs text-pretty text-muted-foreground">
        Read from the renderer each time the scene stops moving. The frame count only rises when
        something changed on screen.
      </p>
      <dl className="mt-3 flex flex-col gap-2">
        {STAT_ROWS.map(({ key, label }) => (
          <div key={key} className="flex items-baseline justify-between gap-3">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-mono text-xs tabular-nums">{stats ? stats[key] : '–'}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

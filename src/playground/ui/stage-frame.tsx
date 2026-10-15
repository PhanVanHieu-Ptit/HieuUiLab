import { useEffect, useRef, useState } from 'react'

import { DemoErrorBoundary } from '@/components/site/demo-error-boundary'
import { cn } from '@/lib/cn'

import type { PlaygroundExample, ResolvedExample, StageHeight } from '../example'
import type { StageTheme, StageViewport } from '../state'

const heights: Record<StageHeight, string> = {
  sm: 'min-h-32',
  md: 'min-h-48',
  lg: 'min-h-[28rem]',
}

// Written out in full so Tailwind can see them.
const widths: Record<StageViewport, string> = {
  full: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
}

const themes: Record<StageTheme, string> = {
  site: '',
  light: 'light',
  dark: 'dark',
}

/** True while the element is wider inside than out, i.e. it scrolls sideways. */
function useHorizontalOverflow<E extends HTMLElement>() {
  const ref = useRef<E>(null)
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      setOverflowing(node.scrollWidth > node.clientWidth + 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => {
      observer.disconnect()
    }
  }, [])
  return [ref, overflowing] as const
}

interface StageFrameProps {
  example: PlaygroundExample
  resolved: ResolvedExample
  theme: StageTheme
  viewport: StageViewport
  /** Changes on reset, so a stage that failed to render gets a fresh start. */
  generation: number
}

/**
 * Shows one example's `Stage` at the chosen theme and width. It only knows the example and what
 * it resolved to, never the controls. The frame clips and contains `fixed` content, so a Dialog
 * portalled into it stays inside.
 */
export function StageFrame({ example, resolved, theme, viewport, generation }: StageFrameProps) {
  const [scrollRef, overflowing] = useHorizontalOverflow<HTMLDivElement>()
  // A callback ref in state: the portal target is not known until the frame has mounted.
  const [portalRoot, setPortalRoot] = useState<HTMLDivElement | null>(null)
  const { Stage } = example
  // Remounted when the values change, so props that only seed state (such as a default page
  // size) apply again, and a stage that threw recovers on the next change.
  const stageKey = `${String(generation)}:${JSON.stringify(resolved.values)}`

  return (
    <div
      ref={scrollRef}
      // A region that scrolls must be focusable to be scrolled by keyboard (WCAG 2.1.1).
      {...(overflowing
        ? { role: 'region', 'aria-label': `${example.title} preview, scrollable`, tabIndex: 0 }
        : {})}
      className="overflow-x-auto rounded-lg focus-ring"
    >
      <div
        role="group"
        aria-label={`${example.title} preview`}
        className={cn(
          'relative isolate flex transform-gpu overflow-hidden rounded-lg border bg-surface p-6 text-surface-foreground sm:p-10',
          example.layout === 'centered'
            ? 'items-center justify-center-safe'
            : 'flex-col justify-center *:w-full',
          heights[example.height],
          widths[viewport],
          themes[theme],
        )}
      >
        <DemoErrorBoundary key={stageKey}>
          <Stage config={resolved.config} portalContainer={portalRoot} />
        </DemoErrorBoundary>
        <div ref={setPortalRoot} className="contents" />
      </div>
    </div>
  )
}

import { defaultValues, sanitizeValue, type ControlSchema, type ControlValues } from './controls'

/** `site` follows the site's theme; the others force the preview to one theme. */
export type StageTheme = 'site' | 'light' | 'dark'

/** Width of the preview frame; `full` fills the available width. */
export type StageViewport = 'full' | 'tablet' | 'mobile'

export const stageThemes: readonly { value: StageTheme; label: string }[] = [
  { value: 'site', label: 'Site' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export const stageViewports: readonly { value: StageViewport; label: string; width?: number }[] = [
  { value: 'full', label: 'Full' },
  { value: 'tablet', label: 'Tablet', width: 768 },
  { value: 'mobile', label: 'Mobile', width: 375 },
]

export const defaultTheme: StageTheme = 'site'
export const defaultViewport: StageViewport = 'full'

export function isStageTheme(value: unknown): value is StageTheme {
  return stageThemes.some((theme) => theme.value === value)
}

export function isStageViewport(value: unknown): value is StageViewport {
  return stageViewports.some((viewport) => viewport.value === value)
}

export interface WorkbenchState {
  readonly values: ControlValues
  readonly theme: StageTheme
  readonly viewport: StageViewport
  /** Bumped by every reset, so fields holding a draft can start over. */
  readonly generation: number
}

export type WorkbenchAction =
  | { type: 'set'; key: string; value: unknown }
  | { type: 'theme'; theme: unknown }
  | { type: 'viewport'; viewport: unknown }
  | { type: 'reset' }

export function initialWorkbenchState(schema: ControlSchema): WorkbenchState {
  return {
    values: defaultValues(schema),
    theme: defaultTheme,
    viewport: defaultViewport,
    generation: 0,
  }
}

/**
 * Applies an action. Every value is validated here, so no input can put the state outside
 * its schema; an invalid or unknown input leaves the state as it was.
 */
export function reduceWorkbench(
  schema: ControlSchema,
  state: WorkbenchState,
  action: WorkbenchAction,
): WorkbenchState {
  switch (action.type) {
    case 'set': {
      const control = Object.hasOwn(schema, action.key) ? schema[action.key] : undefined
      if (!control) return state
      const value = sanitizeValue(control, action.value)
      if (state.values[action.key] === value) return state
      return { ...state, values: { ...state.values, [action.key]: value } }
    }
    case 'theme':
      return isStageTheme(action.theme) && action.theme !== state.theme
        ? { ...state, theme: action.theme }
        : state
    case 'viewport':
      return isStageViewport(action.viewport) && action.viewport !== state.viewport
        ? { ...state, viewport: action.viewport }
        : state
    case 'reset':
      return { ...initialWorkbenchState(schema), generation: state.generation + 1 }
  }
}

/** The current configuration as shown and copied: plain data, never executed. */
export function serializeConfiguration(
  exampleId: string,
  state: Pick<WorkbenchState, 'values' | 'theme' | 'viewport'>,
): string {
  return JSON.stringify(
    {
      example: exampleId,
      controls: state.values,
      theme: state.theme,
      viewport: state.viewport,
    },
    null,
    2,
  )
}

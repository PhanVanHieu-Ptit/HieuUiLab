import { sameFeature, type FeatureRef, type LayerId } from './layers'
import type { LayerStatuses } from './map-types'

/** What the visitor asked for, and what the map last reported. The map itself holds no state of its own. */
export interface ViewerState {
  visibility: Record<LayerId, boolean>
  selected: FeatureRef | null
  basemap: {
    /** Which basemap the visitor chose. */
    requested: 'bundled' | 'online'
    /** `loading` from the click until the provider's style is on screen. */
    phase: 'ready' | 'loading'
    /** Why the last online request ended, in words that carry no URL or key. */
    error: string | null
  }
  layerStatus: LayerStatuses
}

export type ViewerAction =
  | { type: 'toggleLayer'; layer: LayerId; visible: boolean }
  | { type: 'select'; ref: FeatureRef }
  | { type: 'clearSelection' }
  | { type: 'requestOnline' }
  | { type: 'useBundled' }
  | { type: 'basemapReady' }
  | { type: 'basemapFailed'; message: string }
  | { type: 'layerStatus'; statuses: LayerStatuses }
  | { type: 'mapReset' }

export const INITIAL_VISIBILITY: Readonly<Record<LayerId, boolean>> = {
  sites: true,
  route: true,
  zones: true,
}

const LOADING_STATUSES: LayerStatuses = { sites: 'loading', route: 'loading', zones: 'loading' }

export const initialViewerState: ViewerState = {
  visibility: { ...INITIAL_VISIBILITY },
  selected: null,
  basemap: { requested: 'bundled', phase: 'ready', error: null },
  layerStatus: LOADING_STATUSES,
}

function sameStatuses(a: LayerStatuses, b: LayerStatuses): boolean {
  return a.sites === b.sites && a.route === b.route && a.zones === b.zones
}

export function viewerReducer(state: ViewerState, action: ViewerAction): ViewerState {
  switch (action.type) {
    case 'toggleLayer': {
      if (state.visibility[action.layer] === action.visible) return state
      return {
        ...state,
        visibility: { ...state.visibility, [action.layer]: action.visible },
        // A feature on a hidden layer cannot be seen, so it cannot stay selected.
        selected:
          !action.visible && state.selected?.layer === action.layer ? null : state.selected,
      }
    }
    case 'select':
      if (!state.visibility[action.ref.layer]) return state
      if (sameFeature(state.selected, action.ref)) return state
      return { ...state, selected: action.ref }
    case 'clearSelection':
      return state.selected === null ? state : { ...state, selected: null }
    case 'requestOnline':
      return { ...state, basemap: { requested: 'online', phase: 'loading', error: null } }
    case 'useBundled':
      return { ...state, basemap: { requested: 'bundled', phase: 'ready', error: null } }
    case 'basemapReady':
      if (state.basemap.requested !== 'online') return state
      return { ...state, basemap: { ...state.basemap, phase: 'ready' } }
    case 'basemapFailed':
      return {
        ...state,
        basemap: { requested: 'bundled', phase: 'ready', error: action.message },
      }
    case 'layerStatus':
      return sameStatuses(state.layerStatus, action.statuses)
        ? state
        : { ...state, layerStatus: action.statuses }
    case 'mapReset':
      // A new map starts from loading again; the visitor's own choices carry over.
      return sameStatuses(state.layerStatus, LOADING_STATUSES)
        ? state
        : { ...state, layerStatus: LOADING_STATUSES }
  }
}

/** What the layer list shows for a layer: hidden by the visitor, or what the map reports. */
export function displayStatus(
  state: Pick<ViewerState, 'visibility' | 'layerStatus'>,
  layer: LayerId,
): 'hidden' | 'loading' | 'ready' | 'error' {
  return state.visibility[layer] ? state.layerStatus[layer] : 'hidden'
}

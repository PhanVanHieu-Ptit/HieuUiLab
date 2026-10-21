import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from '@/hooks/use-theme'

import type { OnlineBasemap } from './config'
import { MaplibreViewerDemo } from './maplibre-viewer-demo'
import { MapInitError, type MapController, type MapControllerOptions } from './map-types'
import { MapViewer } from './map-viewer'

interface Entry {
  controller: { [Method in keyof MapController]: ReturnType<typeof vi.fn> }
  options: MapControllerOptions
  signal: AbortSignal
  container: HTMLElement
}

/**
 * Stands in for `map-controller.ts` and `webgl-support.ts`, so the viewer runs without WebGL or
 * the map library. The stand-in behaves like the real controller in the one way that matters
 * here: a call whose signal was aborted never produces a map.
 */
const harness = vi.hoisted(() => ({
  supported: true,
  /** When true, a call waits for `release()` instead of settling at once. */
  hold: false,
  /** When true, the stand-in builds a map even after an abort, to exercise the late-resolve guard. */
  ignoreSignal: false,
  /** Errors for the next calls to reject with, in order. */
  failures: [] as Error[],
  calls: 0,
  /** Controllers that were actually built. */
  entries: [] as Entry[],
  waiting: [] as (() => void)[],
}))

vi.mock('../shared/webgl-support', () => ({
  supportsWebgl2: () => harness.supported,
}))

vi.mock('./map-controller', () => ({
  createMapController: (
    container: HTMLElement,
    options: MapControllerOptions,
    signal: AbortSignal,
  ) =>
    new Promise<MapController>((resolve, reject) => {
      harness.calls += 1
      const failure = harness.failures.shift()
      const finish = () => {
        if (failure !== undefined) {
          reject(failure)
          return
        }
        if (signal.aborted && !harness.ignoreSignal) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        const controller = {
          setLayerVisibility: vi.fn(),
          selectFeature: vi.fn(),
          focusFeature: vi.fn(),
          resetView: vi.fn(),
          setBasemap: vi.fn(),
          setPalette: vi.fn(),
          dispose: vi.fn(),
        }
        harness.entries.push({ controller, options, signal, container })
        resolve(controller)
      }
      if (harness.hold) harness.waiting.push(finish)
      else queueMicrotask(finish)
    }),
}))

const unconfigured: OnlineBasemap = { status: 'unconfigured' }
const SECRET = 'SEKRET-123'
const readyOnline: OnlineBasemap = {
  status: 'ready',
  styleUrl: `https://tiles.example.com/style.json?key=${SECRET}`,
  host: 'tiles.example.com',
  attribution: '© Example Maps',
  providerName: 'Example Maps',
}

function entryAt(index = 0): Entry {
  const entry = harness.entries[index]
  if (!entry) throw new Error(`No map was built at index ${String(index)}`)
  return entry
}

function liveControllers(): Entry[] {
  return harness.entries.filter((entry) => entry.controller.dispose.mock.calls.length === 0)
}

async function mapReady() {
  await waitFor(() => {
    expect(screen.queryByText('Loading map')).not.toBeInTheDocument()
  })
}

async function renderReady(online: OnlineBasemap = unconfigured) {
  const view = render(<MapViewer online={online} />)
  await mapReady()
  return { ...view, user: userEvent.setup() }
}

function ThemeButtons() {
  const { setTheme } = useTheme()
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setTheme('dark')
        }}
      >
        Go dark
      </button>
      <button
        type="button"
        onClick={() => {
          setTheme('system')
        }}
      >
        Follow system
      </button>
    </>
  )
}

beforeEach(() => {
  harness.supported = true
  harness.hold = false
  harness.ignoreSignal = false
  harness.failures.length = 0
  harness.calls = 0
  harness.entries.length = 0
  harness.waiting.length = 0
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('without WebGL2', () => {
  it('explains why there is no map and never starts one', () => {
    harness.supported = false
    render(<MapViewer online={unconfigured} />)
    expect(screen.getByRole('heading', { name: 'Interactive map unavailable' })).toBeInTheDocument()
    expect(harness.calls).toBe(0)
  })
})

describe('starting up', () => {
  it('shows one loading status until the map has drawn', async () => {
    harness.hold = true
    render(<MapViewer online={unconfigured} />)
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(screen.getByText('Loading map')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeDisabled()

    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    await mapReady()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset view' })).toBeEnabled()
  })

  it('builds the map with the page’s palette and every layer visible', async () => {
    await renderReady()
    expect(harness.calls).toBe(1)
    const { options } = entryAt()
    expect(options.visibility).toEqual({ sites: true, route: true, zones: true })
    expect(options.palette.categories.harbour).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('gives the map a container with no React children and a fixed class', async () => {
    await renderReady()
    const { container } = entryAt()
    expect(container.className).toBe('size-full')
    expect(container.parentElement).not.toBeNull()
  })

  it('lists the layers with their status, the features, and the legend', async () => {
    await renderReady()
    expect(screen.getByRole('switch', { name: 'Sites' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Service route' })).toBeChecked()
    expect(screen.getByRole('switch', { name: 'Service zones' })).toBeChecked()
    expect(screen.getByRole('heading', { name: 'Legend' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Lumen Harbour/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^Coastal service loop/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^Harbour district/ })).toBeEnabled()
  })
})

describe('layer controls', () => {
  it('hides a layer on the map and says so', async () => {
    const { user } = await renderReady()
    const { controller } = entryAt()
    await user.click(screen.getByRole('switch', { name: 'Service route' }))
    expect(controller.setLayerVisibility).toHaveBeenCalledWith('route', false)
    expect(screen.getByRole('switch', { name: 'Service route' })).not.toBeChecked()
    const row = screen.getByRole('switch', { name: 'Service route' }).closest('li')
    expect(row).not.toBeNull()
    expect(within(row as HTMLElement).getByText('Hidden')).toBeInTheDocument()
  })

  it('shows it again when switched back on', async () => {
    const { user } = await renderReady()
    const { controller } = entryAt()
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    // The effect re-applies every layer on each change, so look at the last word on this one.
    const forSites = controller.setLayerVisibility.mock.calls.filter(([layer]) => layer === 'sites')
    expect(forSites.at(-1)).toEqual(['sites', true])
  })

  it('shows what the map reports for each layer', async () => {
    await renderReady()
    const sitesRow = screen.getByRole('switch', { name: 'Sites' }).closest('li') as HTMLElement
    expect(within(sitesRow).getByText('Loading')).toBeInTheDocument()

    act(() => {
      entryAt().options.onLayerStatus({ sites: 'ready', route: 'ready', zones: 'error' })
    })
    expect(within(sitesRow).getByText('Ready')).toBeInTheDocument()
    const zonesRow = screen
      .getByRole('switch', { name: 'Service zones' })
      .closest('li') as HTMLElement
    expect(within(zonesRow).getByText('Error')).toBeInTheDocument()
  })

  it('shows hidden rather than the map’s status for a layer that is off', async () => {
    const { user } = await renderReady()
    act(() => {
      entryAt().options.onLayerStatus({ sites: 'error', route: 'ready', zones: 'ready' })
    })
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    const row = screen.getByRole('switch', { name: 'Sites' }).closest('li') as HTMLElement
    expect(within(row).getByText('Hidden')).toBeInTheDocument()
    expect(within(row).queryByText('Error')).not.toBeInTheDocument()
  })

  it('disables the features of a hidden layer', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('switch', { name: 'Service zones' }))
    expect(screen.getByRole('button', { name: /^Harbour district/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Lumen Harbour/ })).toBeEnabled()
  })
})

describe('selecting a feature', () => {
  it('selects from the list: panel, highlight on the map, and the camera', async () => {
    const { user } = await renderReady()
    const { controller } = entryAt()
    await user.click(screen.getByRole('button', { name: /^Lumen Harbour/ }))

    const panel = screen.getByRole('region', { name: 'Selected feature' })
    expect(within(panel).getByText('Lumen Harbour')).toBeInTheDocument()
    expect(within(panel).getByText('5.0000° N, 35.0000° W')).toBeInTheDocument()
    expect(controller.selectFeature).toHaveBeenLastCalledWith({
      layer: 'sites',
      id: 'lumen-harbour',
    })
    expect(controller.focusFeature).toHaveBeenCalledWith({ layer: 'sites', id: 'lumen-harbour' })
    expect(screen.getByRole('button', { name: /^Lumen Harbour/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('announces the selection once, politely', async () => {
    const { user, container } = await renderReady()
    await user.click(screen.getByRole('button', { name: /^North Light/ }))
    const live = container.querySelector('[aria-live="polite"]')
    expect(live).toHaveTextContent('Selected North Light.')
  })

  it('selects from a click on the map, without moving the camera', async () => {
    await renderReady()
    const { controller, options } = entryAt()
    act(() => {
      options.onFeatureClick({ layer: 'zones', id: 'harbour-district' })
    })
    const panel = screen.getByRole('region', { name: 'Selected feature' })
    expect(within(panel).getByText('Harbour district')).toBeInTheDocument()
    expect(within(panel).getByText('Lumen Harbour')).toBeInTheDocument()
    expect(controller.selectFeature).toHaveBeenLastCalledWith({
      layer: 'zones',
      id: 'harbour-district',
    })
    expect(controller.focusFeature).not.toHaveBeenCalled()
  })

  it('shows a route’s length and stops', async () => {
    await renderReady()
    act(() => {
      entryAt().options.onFeatureClick({ layer: 'route', id: 'coastal-loop' })
    })
    const panel = screen.getByRole('region', { name: 'Selected feature' })
    expect(within(panel).getByText(/^\d+\.\d km$/)).toBeInTheDocument()
    expect(within(panel).getAllByRole('listitem').length).toBeGreaterThanOrEqual(9)
  })

  it('clears on a click on empty space and on the Clear button', async () => {
    const { user } = await renderReady()
    const { controller, options } = entryAt()
    act(() => {
      options.onFeatureClick({ layer: 'sites', id: 'north-light' })
    })
    act(() => {
      options.onFeatureClick(null)
    })
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
    expect(controller.selectFeature).toHaveBeenLastCalledWith(null)

    await user.click(screen.getByRole('button', { name: /^North Light/ }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
  })

  it('clears the selection when its layer is hidden', async () => {
    const { user } = await renderReady()
    const { controller } = entryAt()
    await user.click(screen.getByRole('button', { name: /^Lumen Harbour/ }))
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
    expect(controller.selectFeature).toHaveBeenLastCalledWith(null)
  })

  it('ignores a map click on a layer that is hidden', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    act(() => {
      entryAt().options.onFeatureClick({ layer: 'sites', id: 'north-light' })
    })
    expect(screen.getByText(/Nothing is selected/)).toBeInTheDocument()
  })

  it('resets the view from the button', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('button', { name: 'Reset view' }))
    expect(entryAt().controller.resetView).toHaveBeenCalledTimes(1)
  })
})

describe('lifecycle', () => {
  it('disposes the map once on unmount, after aborting its signal', async () => {
    const { unmount } = await renderReady()
    const { controller, signal } = entryAt()
    expect(signal.aborted).toBe(false)
    unmount()
    expect(signal.aborted).toBe(true)
    expect(controller.dispose).toHaveBeenCalledTimes(1)
  })

  it('does not rebuild the map when the visitor changes things', async () => {
    const { user } = await renderReady()
    await user.click(screen.getByRole('switch', { name: 'Sites' }))
    await user.click(screen.getByRole('button', { name: /^North Light/ }))
    act(() => {
      entryAt().options.onLayerStatus({ sites: 'ready', route: 'ready', zones: 'ready' })
    })
    expect(harness.calls).toBe(1)
    expect(entryAt().controller.dispose).not.toHaveBeenCalled()
  })

  it('does not rebuild the map when the online configuration prop changes', async () => {
    const { rerender } = await renderReady(unconfigured)
    rerender(<MapViewer online={{ ...readyOnline }} />)
    rerender(<MapViewer online={{ ...readyOnline }} />)
    rerender(
      <MapViewer online={{ ...readyOnline, styleUrl: 'https://tiles.example.org/s.json' }} />,
    )
    rerender(<MapViewer online={unconfigured} />)
    expect(harness.calls).toBe(1)
    expect(entryAt().controller.dispose).not.toHaveBeenCalled()
  })

  it('leaves exactly one live map under StrictMode’s mount, unmount, mount', async () => {
    render(
      <StrictMode>
        <MapViewer online={unconfigured} />
      </StrictMode>,
    )
    await mapReady()
    expect(harness.calls).toBe(2)
    expect(harness.entries).toHaveLength(1)
    expect(liveControllers()).toHaveLength(1)
  })

  it('disposes a map that arrives after the page has gone, even if the builder ignored the abort', async () => {
    harness.ignoreSignal = true
    harness.hold = true
    const { unmount } = render(<MapViewer online={unconfigured} />)
    unmount()
    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    expect(harness.entries).toHaveLength(1)
    expect(liveControllers()).toHaveLength(0)
  })

  it('leaves no map alive after unmount under StrictMode', async () => {
    const { unmount } = render(
      <StrictMode>
        <MapViewer online={unconfigured} />
      </StrictMode>,
    )
    await mapReady()
    unmount()
    expect(liveControllers()).toHaveLength(0)
  })
})

describe('theme', () => {
  it('repaints the existing map when the theme changes', async () => {
    const user = userEvent.setup()
    render(
      <>
        <MapViewer online={unconfigured} />
        <ThemeButtons />
      </>,
    )
    await mapReady()
    const { controller } = entryAt()
    const before = controller.setPalette.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Go dark' }))
    expect(controller.setPalette.mock.calls.length).toBeGreaterThan(before)
    expect(harness.calls).toBe(1)
    expect(controller.dispose).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Follow system' }))
  })
})

describe('the online basemap', () => {
  it('is off, with the reason, when the build configures none', async () => {
    await renderReady(unconfigured)
    const button = screen.getByRole('button', { name: 'Load online basemap' })
    expect(button).toBeDisabled()
    expect(screen.getByText(/No online basemap is configured/)).toBeInTheDocument()
  })

  it.each<[string, OnlineBasemap, RegExp]>([
    ['a missing key', { status: 'missing-key' }, /needs an API key/],
    ['a missing attribution', { status: 'missing-attribution' }, /VITE_MAP_ATTRIBUTION/],
    ['an unsafe URL', { status: 'invalid', reason: 'not-https' }, /must use https/],
  ])('stays off with %s, and says why', async (_name, online, reason) => {
    await renderReady(online)
    expect(screen.getByRole('button', { name: 'Load online basemap' })).toBeDisabled()
    expect(screen.getByText(reason)).toBeInTheDocument()
  })

  it('asks nothing of the provider until the visitor presses the button', async () => {
    await renderReady(readyOnline)
    const { controller } = entryAt()
    // The viewer may confirm the bundled basemap, but it never names a provider’s style yet.
    expect(controller.setBasemap.mock.calls.every(([target]) => target === 'bundled')).toBe(true)
    expect(screen.getByText(/can see your IP address/)).toBeInTheDocument()
    expect(screen.getByText(/can limit or block use/)).toBeInTheDocument()
    expect(screen.getByText(/© Example Maps/)).toBeInTheDocument()
  })

  it('loads the online basemap on request, then reports ready', async () => {
    const { user } = await renderReady(readyOnline)
    const { controller, options } = entryAt()
    await user.click(screen.getByRole('button', { name: 'Load online basemap' }))
    expect(controller.setBasemap).toHaveBeenLastCalledWith({
      styleUrl: readyOnline.styleUrl,
      attribution: '© Example Maps',
    })
    expect(screen.getByText('Online, loading')).toBeInTheDocument()

    act(() => {
      options.onBasemapReady()
    })
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(
      screen.getByText(/Tiles and labels from Example Maps \(tiles\.example\.com\)/),
    ).toBeInTheDocument()
  })

  it('goes back to the bundled basemap on request', async () => {
    const { user } = await renderReady(readyOnline)
    const { controller } = entryAt()
    await user.click(screen.getByRole('button', { name: 'Load online basemap' }))
    await user.click(screen.getByRole('button', { name: 'Use bundled basemap' }))
    expect(controller.setBasemap).toHaveBeenLastCalledWith('bundled')
    expect(screen.getByText('Bundled')).toBeInTheDocument()
  })

  it('falls back to the bundled basemap and says why when the map gives up on the provider', async () => {
    const { user } = await renderReady(readyOnline)
    const { controller, options } = entryAt()
    await user.click(screen.getByRole('button', { name: 'Load online basemap' }))
    act(() => {
      options.onBasemapFailed('The basemap host (tiles.example.com) refused requests (HTTP 429).')
    })
    expect(screen.getByText('Online basemap stopped')).toBeInTheDocument()
    expect(screen.getByText(/refused requests \(HTTP 429\)/)).toBeInTheDocument()
    expect(controller.setBasemap).toHaveBeenLastCalledWith('bundled')
    expect(screen.getByText('Bundled')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Load online basemap' })).toBeEnabled()
  })

  it('never shows the style URL or its key', async () => {
    const { user } = await renderReady(readyOnline)
    await user.click(screen.getByRole('button', { name: 'Load online basemap' }))
    act(() => {
      entryAt().options.onBasemapReady()
    })
    expect(document.body.innerHTML).not.toContain(SECRET)
    expect(document.body.innerHTML).not.toContain('style.json')
  })
})

describe('when the map cannot start', () => {
  it('offers Retry for a failed start, and a fresh map replaces the failure', async () => {
    harness.failures.push(new MapInitError('init-failed', 'The map could not be created.'))
    const { user } = await renderReady()
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('The map could not start')).toBeInTheDocument()
    expect(harness.entries).toHaveLength(0)

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    await mapReady()
    expect(harness.calls).toBe(2)
    expect(harness.entries).toHaveLength(1)
  })

  it('marks every layer as failed instead of leaving it loading, and starts over on Retry', async () => {
    harness.failures.push(new MapInitError('init-failed', 'The map could not be created.'))
    const { user } = await renderReady()
    await screen.findByRole('alert')
    const layerRow = (name: string) =>
      screen.getByRole('switch', { name }).closest('li') as HTMLElement
    for (const name of ['Sites', 'Service route', 'Service zones']) {
      expect(within(layerRow(name)).getByText('Error')).toBeInTheDocument()
      expect(within(layerRow(name)).queryByText('Loading')).not.toBeInTheDocument()
    }

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => {
      expect(harness.entries).toHaveLength(1)
    })
    expect(within(layerRow('Sites')).getByText('Loading')).toBeInTheDocument()
    expect(within(layerRow('Sites')).queryByText('Error')).not.toBeInTheDocument()
  })

  it('brings a map started after Retry up to date with what the visitor chose meanwhile', async () => {
    harness.failures.push(new MapInitError('init-failed', 'The map could not be created.'))
    const { user } = await renderReady()
    await screen.findByRole('alert')
    await user.click(screen.getByRole('switch', { name: 'Service route' }))
    await user.click(screen.getByRole('button', { name: /^North Light/ }))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => {
      expect(harness.entries).toHaveLength(1)
    })
    const { controller } = entryAt()
    await waitFor(() => {
      expect(controller.setLayerVisibility).toHaveBeenCalledWith('route', false)
    })
    expect(controller.selectFeature).toHaveBeenLastCalledWith({ layer: 'sites', id: 'north-light' })
  })

  it('offers only a reload when the library could not be downloaded', async () => {
    harness.failures.push(
      new MapInitError('import-failed', 'The map library could not be downloaded.'),
    )
    await renderReady()
    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('The map library could not be loaded')).toBeInTheDocument()
    expect(within(alert).getByRole('button', { name: 'Reload page' })).toBeInTheDocument()
    expect(within(alert).queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('treats a WebGL2 failure from the constructor like an unavailable browser', async () => {
    harness.failures.push(new MapInitError('webgl2-unavailable', 'No WebGL2.'))
    await renderReady()
    expect(
      await screen.findByRole('heading', { name: 'Interactive map unavailable' }),
    ).toBeInTheDocument()
  })

  it('wraps an error that is not a MapInitError', async () => {
    harness.failures.push(new Error('surprise'))
    await renderReady()
    expect(await screen.findByText('The map could not start')).toBeInTheDocument()
  })

  it('ignores a failure that belongs to a mount that has already gone', async () => {
    harness.hold = true
    harness.failures.push(new MapInitError('init-failed', 'late'))
    const { unmount } = render(<MapViewer online={unconfigured} />)
    unmount()
    await act(async () => {
      harness.waiting.splice(0).forEach((release) => {
        release()
      })
      await Promise.resolve()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('graphics context', () => {
  it('warns while the context is lost, and clears the warning when it returns', async () => {
    await renderReady()
    expect(screen.queryByText('The graphics context was lost')).not.toBeInTheDocument()
    act(() => {
      entryAt().options.onContextChange(true)
    })
    expect(screen.getByText('The graphics context was lost')).toBeInTheDocument()
    act(() => {
      entryAt().options.onContextChange(false)
    })
    expect(screen.queryByText('The graphics context was lost')).not.toBeInTheDocument()
  })
})

describe('the demo', () => {
  it('reads the online basemap from the build environment', async () => {
    vi.stubEnv('VITE_MAP_STYLE_URL', 'https://tiles.example.com/style.json')
    vi.stubEnv('VITE_MAP_ATTRIBUTION', '© Example Maps')
    render(<MaplibreViewerDemo />)
    await mapReady()
    expect(screen.getByRole('button', { name: 'Load online basemap' })).toBeEnabled()
  })

  it('offers no online basemap when the build configures none', async () => {
    vi.stubEnv('VITE_MAP_STYLE_URL', '')
    render(<MaplibreViewerDemo />)
    await mapReady()
    expect(screen.getByRole('button', { name: 'Load online basemap' })).toBeDisabled()
  })
})

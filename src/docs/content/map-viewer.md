# Map viewer and basemaps

The [map viewer](/labs/maps/maplibre-viewer) draws an invented island with MapLibre GL JS. It needs no map provider: by default its basemap is drawn from data in the repository, and opening the page makes no tile requests. This page covers the optional online basemap, what each provider you might point it at requires, and how the viewer behaves around it.

## What is in the repository {#repository}

Everything lives in `src/lab/maplibre-viewer/`. The sample data in `src/lab/maplibre-viewer/data.ts` is invented: the island, the sites, the route, and the zones describe no real place, organisation, or survey. The island sits in open ocean so that it cannot be mistaken for a real coastline, even over an online basemap.

The data, the settings in `src/lab/maplibre-viewer/config.ts`, the style builders, and the React controls are separate files. Only `src/lab/maplibre-viewer/map-controller.ts` imports the map library, and it does so dynamically, so the library is downloaded only by a browser that can create a WebGL2 context.

## The bundled basemap {#bundled}

The default basemap is a plain background and the island, drawn from GeoJSON in the repository. It asks nothing of a provider: no tiles, no fonts, no sprites, and no key. The style has no text layers, because text needs glyphs from a font server. The map's attribution reads "Synthetic sample data" and MapLibre's own credit, because nothing else is on the map.

## Configure an online basemap {#configure}

An online basemap is optional and is configured when the site is built. The settings are Vite environment variables, listed with comments in `.env.example` and typed in `src/env.d.ts`.

| Variable                 | Needed                         | Purpose                                                             |
| ------------------------ | ------------------------------ | ------------------------------------------------------------------- |
| `VITE_MAP_STYLE_URL`     | To enable the online basemap   | A MapLibre style document (a `style.json`), not a raw tile URL      |
| `VITE_MAP_API_KEY`       | When the style URL has `{key}` | Replaces `{key}` in the style URL, URL-encoded                      |
| `VITE_MAP_ATTRIBUTION`   | To enable the online basemap   | The credit the provider asks for, as plain text                     |
| `VITE_MAP_PROVIDER_NAME` | No                             | The provider's name in the Basemap panel; defaults to the host name |

```bash title="a local .env.local"
VITE_MAP_STYLE_URL=https://tiles.example.com/style.json?key={key}
VITE_MAP_API_KEY=your-public-key
VITE_MAP_ATTRIBUTION=© Example Maps, © data contributors
VITE_MAP_PROVIDER_NAME=Example Maps
```

> [!IMPORTANT]
> These values are public. Vite writes every `VITE_` variable into the JavaScript that each visitor downloads, so a key in a style URL is visible in the bundle and in the network panel. Use a key the provider lets you restrict to your site's origin, and never put a secret in a variable with this prefix. `.gitignore` excludes `.env` files except `.env.example`.

`resolveOnlineBasemap` in `src/lab/maplibre-viewer/config.ts` turns these values into one of five states and never throws. The Basemap panel shows the reason when the online basemap cannot be used, and never shows the URL or the key.

| State               | What the visitor sees                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Nothing configured  | The bundled basemap, with a disabled button and a note naming the setting                               |
| `{key}` with no key | The same, saying the style URL needs an API key                                                         |
| No attribution      | The same, saying an online basemap needs its provider's credit                                          |
| Invalid URL         | The same, saying why: not a URL, not https, credentials in the URL, or a placeholder other than `{key}` |
| Ready               | A button that loads the online basemap, with the host and the credit                                    |

The URL must use https. Plain http is accepted only for a loopback host such as `localhost`, for a tile server you run yourself. A URL that carries a username or password is rejected. The attribution is required because providers make credit a condition of use, so the viewer refuses to enable an online basemap without one.

> [!NOTE]
> The viewer takes a style document, not a tile URL template. A raw raster tile endpoint, such as the OpenStreetMap Foundation's, is not a style, so using one means hosting a small style document that references it. This repository ships none.

## Providers and what they require {#providers}

The notes below were checked on 2026-10-21 against each provider's own pages. Terms change, so read the current text before relying on any of it. This repository configures no provider by default, and none of these is an endorsement.

### OpenStreetMap Foundation tile servers {#osm}

Source: [the OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/).

- **Status:** shared, donation-funded raster tiles. The policy calls availability best-effort, with no SLA or guarantee, and says access may be withdrawn or blocked without notice. It is not a dependable default for a product.
- **Attribution:** required, shown clearly and not hidden behind a toggle, following the OpenStreetMap Foundation's attribution guidelines. The usual text is "© OpenStreetMap contributors".
- **Allowed:** interactive viewing, where the client requests the tiles for the current view, and repeat views from a cache that follows the server's caching headers.
- **Not allowed:** bulk downloading or prefetching, offline use, and headless clients that pan or zoom to force rendering. Use https, send a real Referer from a web client, and do not disable caching.
- **API key:** none.

### MapLibre demo tiles {#demotiles}

Source: [the MapLibre demotiles repository](https://github.com/maplibre/demotiles).

- **Status:** sample vector tiles and styles hosted on GitHub Pages for web, hello-world, and CI testing. They are demo data. The repository states no production service level.
- **Detail:** the world style holds country polygons, lines, and centroids from Natural Earth, up to a low zoom level, so there is no street-level detail.
- **Attribution:** the repository asks that the licence attributions of each source be kept and shown on the map. Its code is BSD-3-Clause, and some other demo sources in it carry non-commercial licences, so check the one you use.
- **API key:** none.

### Other providers {#others}

Hosted and self-hosted tile providers each set their own terms, and this repository names none because none has been checked here. Before pointing the viewer at one, find out:

- whether a key is required, and whether it can be limited to your site's origin;
- the exact attribution text, and where it must appear;
- the usage limits, and what happens when they are exceeded;
- whether caching, offline use, and prefetching are allowed.

## What the viewer does with an online basemap {#behavior}

Public tile servers are not unlimited, and the viewer is written not to assume they are.

- **Opt-in.** Nothing is requested from the provider until the visitor presses "Load online basemap". The panel first says that the provider can see the visitor's IP address and the area they view.
- **Checked before use.** The style is fetched without cookies, checked, and only then swapped in, so a bad response cannot blank the map. A style fetch and a style load each have a timeout, `STYLE_FETCH_TIMEOUT_MS` and `STYLE_LOAD_TIMEOUT_MS` in `src/lab/maplibre-viewer/map-controller.ts`, and either one sends the map back to the bundled basemap.
- **Refusals end the attempt.** After `REFUSAL_LIMIT` responses of 401, 403, or 429, the viewer returns to the bundled basemap and says which host refused. Messages name the host and never the URL or the key.
- **No hoarding.** The viewer adds no prefetching, offline storage, or cache of its own. MapLibre requests the tiles for the current view.
- **Credit stays visible.** The attribution appears in the map's attribution control, escaped as text, and in the Basemap panel while the online basemap is showing.
- **The sample layers stay on top.** The island, sites, route, and zones are added over the provider's style. The camera limits that suit the island are relaxed while an online basemap shows.

## The worker, security policy, and hosting {#worker}

MapLibre parses map data in a web worker. A bundled app cannot find that worker beside the library's file, so `loadMapLibre` in `src/lab/maplibre-viewer/map-controller.ts` imports it as an asset with Vite's `?worker&url` query and passes the URL to `setWorkerUrl` before any map exists. Without that, a production build fails with "Worker failed to load" and the map never starts, while every unit test still passes because they replace the library. That is why `e2e/maplibre-viewer.spec.ts` runs the real library.

MapLibre keeps one shared worker for the life of the page, so leaving the map and coming back reuses it. Removing the map releases its canvas, listeners, and graphics context.

No content security policy is configured, and the site is not deployed; [Deployment](/docs/deployment) covers building for a host, setting these variables there, and checking that the worker is served. If you add a policy, MapLibre's documentation asks for `worker-src 'self'` and `img-src data: blob: 'self'`. An online basemap also needs `connect-src` for the style's host, and the hosts of the tiles and fonts that the style names.

## How it is tested {#testing}

The unit tests in `src/lab/maplibre-viewer/` replace MapLibre with a recording stand-in, because jsdom has no WebGL. They cover the settings in `src/lab/maplibre-viewer/config.test.ts`, the layer and selection state, and the lifecycle in `src/lab/maplibre-viewer/map-viewer.test.tsx` and `src/lab/maplibre-viewer/map-controller.test.ts`: one map per mount, every listener released on cleanup, and no rebuild when a prop changes.

What a stand-in cannot show is covered by `e2e/maplibre-viewer.spec.ts`, which starts the real map in the production build, toggles layers, selects features, resizes the window, and leaves and returns. It skips the map tests in a browser without WebGL2. No test contacts a tile provider: the online basemap is tested against stand-ins only. See [Testing strategy](/docs/testing) for the other layers.

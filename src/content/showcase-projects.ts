import { siteConfig } from '@/config/site'

import type { ShowcaseProject } from './showcase-types'

/**
 * Public projects, each backed by files in its repository. Everything here is checked by
 * `validateShowcase` (see showcase-rules.ts): evidence must exist, repositories must be under the
 * owner's own GitHub account, an application needs a live URL, and prose may not carry numeric
 * metrics or business claims.
 *
 * Only public work is listed. Private professional work, including any employer or client code
 * and data, is not published here and has no entry.
 */

/** Both entries below describe this repository. Confirmed public on this date. */
const thisRepository = { url: siteConfig.githubUrl, verifiedOn: '2026-10-17' } as const

/** No public URL exists yet: the README records that deployment is not set up. */
const notDeployed = { status: 'none' } as const

export const showcaseProjects: readonly ShowcaseProject[] = [
  {
    visibility: 'public',
    slug: 'hieu-ui-lab-platform',
    category: 'platform',
    title: 'Hieu UI Lab: a documentation site built on one typed registry',
    summary:
      'The site that documents and runs this lab. A typed registry feeds the navigation, search, catalog, and detail pages, with routing, route metadata, a playground, and tests at every layer.',
    role: 'Design and implementation (single author)',
    period: '2026',
    stack: ['React', 'TypeScript', 'React Router', 'Vite', 'Tailwind CSS', 'Vitest', 'Playwright'],
    problem: [
      'Documentation written by hand drifts from the code it describes: an example is updated in one place and not another, or a new component never reaches the navigation.',
      'A personal engineering lab also has to show its work, so what the site says must stay true as the lab grows.',
    ],
    scope: {
      summary:
        'One single-page app that lists, documents, previews, and tests everything in the lab.',
      includes: [
        'Routing, route metadata, loaders, and redirects',
        'A registry-driven catalog, detail pages, search, and install guidance',
        'A playground limited to pre-defined examples',
        'Labs, templates, notes, and this project showcase as typed content',
        'Unit and end-to-end tests, and a CI workflow',
      ],
      excludes: [
        'A backend, accounts, or any stored data',
        'A content management system or an MDX pipeline',
        'Hosting: the site is not deployed yet',
      ],
    },
    decisions: [
      {
        title: 'One typed registry feeds every listing',
        rationale:
          'Each component and block is one typed entry. The sidebar, the search palette, the catalog, the detail pages, and the landing page all read the same array, so a new entry appears everywhere at once and an entry can be marked planned without a page that pretends it exists.',
        tradeoff:
          'Props tables are still written by hand, so they can drift from a component’s types.',
      },
      {
        title: 'Route metadata lives on the route',
        rationale:
          'Each route declares its title, description, breadcrumb, and whether search engines should skip it. The document title, the meta tags, and the breadcrumb trail are all derived from those declarations.',
        tradeoff:
          'Metadata is applied in the browser, so a crawler that does not run JavaScript sees only the defaults in index.html.',
      },
      {
        title: 'Loaders resolve before pages download',
        rationale:
          'Loaders only look up local typed content, and they run before a lazy page chunk is fetched. An unknown slug becomes a 404 and a moved URL becomes a redirect without downloading the page first.',
        tradeoff: 'Loaders and route metadata stay in the main bundle.',
      },
      {
        title: 'Search and filters live in the URL',
        rationale:
          'The catalog’s query, category, and tags are search parameters, so a filtered view can be shared and Back undoes a filter.',
        tradeoff:
          'Every new filter needs parsing and serializing rules, and invalid values have to be handled.',
      },
      {
        title: 'A playground that runs only what it lists',
        rationale:
          'The playground renders examples from an allow-list. Nothing is looked up by name, compiled, or evaluated at runtime, and lint rules ban dynamic imports and injected markup there.',
        tradeoff: 'It is not a code editor: only the controls an example declares can change.',
      },
    ],
    architecture: {
      summary:
        'A Vite single-page app. Typed content modules and the registry are the data, the router turns them into pages, and small lazy chunks hold the heavy parts.',
      parts: [
        {
          name: 'Navigation config',
          responsibility:
            'One config drives the header, sidebar, mobile drawer, footer, and search palette.',
          path: 'src/config/site.ts',
        },
        {
          name: 'Router',
          responsibility: 'The route tree, with its lazy pages, loaders, and route metadata.',
          path: 'src/router/routes.tsx',
        },
        {
          name: 'Registry',
          responsibility:
            'Typed entries for components and blocks, with validation, catalog queries, and install plans.',
          path: 'src/registry/index.ts',
        },
        {
          name: 'Content',
          responsibility:
            'Typed data for notes, case studies, projects, templates, and experiments.',
          path: 'src/content/projects.ts',
        },
        {
          name: 'Labs',
          responsibility: 'The geospatial and 3D experiments, each loaded on demand.',
          path: 'src/lab/index.ts',
        },
        {
          name: 'Playground',
          responsibility: 'The allow-listed examples and the workbench that runs them.',
          path: 'src/playground/index.ts',
        },
        {
          name: 'Continuous integration',
          responsibility:
            'The workflow that runs lint, formatting, types, tests, build, and end-to-end tests.',
          path: '.github/workflows/ci.yml',
        },
      ],
    },
    challenges: [
      {
        challenge:
          'React Router clears resolved keys on a route’s lazy object in place, so a route tree shared between routers breaks the second one.',
        solution:
          'The route tree is built by a createRoutes() function, so the app and each test get a fresh copy.',
        evidence: [
          { label: 'The route factory', path: 'src/router/routes.tsx', anchor: 'createRoutes' },
          {
            label: 'Tests render a fresh tree',
            path: 'src/test/render.tsx',
            anchor: 'createRoutes',
          },
        ],
      },
      {
        challenge: 'Public URLs must not break as entries are added or moved.',
        solution:
          'A test pins every registry slug, an entry requested under the wrong kind redirects to its own page, and an unknown slug returns a 404 with suggestions.',
        evidence: [
          { label: 'Slug snapshot', path: 'src/registry/registry.test.tsx', anchor: 'URL slugs' },
          {
            label: 'Wrong-kind redirect',
            path: 'src/router/loaders.ts',
            anchor: 'replace(registryHref(elsewhere))',
          },
          { label: 'Redirect tests', path: 'src/router/routes.test.tsx', anchor: 'redirects' },
        ],
      },
      {
        challenge: 'A redirect that stays in history makes Back bounce forward again.',
        solution:
          'Redirects replace the history entry, and an end-to-end test checks that Back and Forward restore the right page, title, and scroll position.',
        evidence: [
          { label: 'Replacing redirects', path: 'src/router/loaders.ts', anchor: 'replace' },
          {
            label: 'Back and forward test',
            path: 'e2e/routes.spec.ts',
            anchor: 'back and forward restore the page',
          },
        ],
      },
      {
        challenge:
          'The theme has to be applied before first paint, or the page flashes the wrong colours.',
        solution:
          'A small inline script in index.html sets the theme from storage before the app loads. The app then reads the same preference through an external store, and end-to-end tests check that the choice persists and changes real colours.',
        evidence: [
          { label: 'Inline script', path: 'index.html', anchor: 'hieu-ui-lab:theme' },
          { label: 'Theme store', path: 'src/hooks/use-theme.ts', anchor: 'useSyncExternalStore' },
          {
            label: 'Theme tests',
            path: 'e2e/shell.spec.ts',
            anchor: 'changes the rendered colors, not just a class',
          },
        ],
      },
      {
        challenge: 'Layout regressions are easy to miss by hand.',
        solution:
          'An end-to-end sweep loads every documented route at three viewport widths in both themes and fails on horizontal overflow.',
        evidence: [
          {
            label: 'Overflow sweep',
            path: 'e2e/shell.spec.ts',
            anchor: 'no horizontal overflow',
          },
        ],
      },
      {
        challenge: 'A showcase can quietly turn into marketing.',
        solution:
          'Project content is typed data with required evidence: every challenge cites files that exist, repositories must be under the author’s own account, an application needs a verified live URL, and a check rejects numeric metrics and business claims.',
        evidence: [
          {
            label: 'The rules',
            path: 'src/content/showcase-rules.ts',
            anchor: 'isOwnRepositoryUrl',
          },
          {
            label: 'Their tests',
            path: 'src/content/showcase-rules.test.ts',
            anchor: 'rejects an application without a live deployment',
          },
        ],
      },
    ],
    media: [
      {
        kind: 'registry-example',
        entry: 'button',
        entryKind: 'component',
        example: 'variants',
        caption:
          'A live example from the registry. The preview, its Code tab, and its docs page all come from one typed entry.',
      },
      {
        kind: 'route-link',
        href: '/playground',
        label: 'Playground',
        description: 'Change a component’s props and watch the preview and the code update.',
      },
      {
        kind: 'route-link',
        href: '/components',
        label: 'Components',
        description: 'The catalog, with search and filters kept in the URL.',
      },
      {
        kind: 'route-link',
        href: '/templates',
        label: 'Templates',
        description: 'Example apps composed from the blocks.',
      },
      {
        kind: 'route-link',
        href: '/labs',
        label: 'Labs',
        description: 'The geospatial and 3D experiments.',
      },
    ],
    repository: thisRepository,
    deployment: notDeployed,
    limitations: [
      'Props tables are written by hand, so they can drift from a component’s types.',
      'A demo’s code is extracted by function name, which relies on the export function convention.',
      'Code shows as plain text for a moment before syntax highlighting loads.',
      'Route metadata is applied in the browser, so a crawler without JavaScript sees only the defaults.',
      'The registry and the source text it shows are in the main bundle, which makes it larger than it needs to be.',
      'There are no pixel-snapshot or automated accessibility scans. Accessibility is covered by contrast tests, semantic markup, and keyboard and focus tests.',
      'The site is not deployed yet, so there is no public URL to link.',
      'The repository has no license file yet.',
    ],
    improvements: [
      'Generate props tables from component types.',
      'Load each registry entry on demand instead of bundling them all.',
      'Add automated accessibility scans to the end-to-end suite.',
      'Deploy with a single-page-app fallback, then record the URL here.',
      'Pre-render route metadata for crawlers.',
      'Choose a license for the repository.',
    ],
    relatedCaseStudies: ['registry-driven-documentation'],
  },
  {
    visibility: 'public',
    slug: 'hieu-ui-lab-component-library',
    category: 'library',
    title: 'Hieu UI Lab component library and design system',
    summary:
      'Accessible React components and page-level blocks on semantic OKLCH tokens, each documented with live examples and checked by tests, designed to be copied into a project rather than installed.',
    role: 'Design and implementation (single author)',
    period: '2026',
    stack: [
      'React',
      'Radix UI',
      'Tailwind CSS v4',
      'OKLCH',
      'class-variance-authority',
      'React Hook Form',
      'Zod',
      'Vitest',
    ],
    problem: [
      'Components that each choose their own colours and states make dark mode a second, slightly different design, and accessibility depends on remembering to check it.',
      'Copy-in components need honest installation details: what a file imports, which packages it needs, and which other components it depends on.',
      'Page-level blocks that fetch data, read the clock, or follow the window are hard to reuse and hard to test.',
    ],
    scope: {
      summary:
        'A set of components, blocks, and design tokens, documented and tested in this repository.',
      includes: [
        'Semantic design tokens for light and dark themes, and shared focus and disabled states',
        'Components and composed blocks, including page-level blocks',
        'Registry metadata, install plans, and the validation that keeps them truthful',
        'Unit tests for behaviour, keyboard use, and colour contrast',
      ],
      excludes: [
        'An npm package, versioning, or a changelog',
        'Themes beyond light and dark, and server rendering',
        'Combobox, which is planned and not built',
      ],
    },
    decisions: [
      {
        title: 'Semantic OKLCH tokens in one stylesheet',
        rationale:
          'Components use roles such as surface and muted-foreground, never palette colours. The light values, a light scope, and the dark overrides sit in one file, and OKLCH lets lightness change without shifting hue.',
        tradeoff: 'OKLCH needs a modern browser, and there is no fallback.',
      },
      {
        title: 'Copy-in files with validated install steps',
        rationale:
          'Each entry is one file. Its declared packages, requirements, and dependencies are compared with what the source actually imports, so the install instructions cannot drift from the code.',
        tradeoff: 'There is no versioning: a copied file does not receive later fixes.',
      },
      {
        title: 'Radix primitives with variant helpers',
        rationale:
          'Behaviour that is easy to get wrong, such as dialogs, selects, tabs, and tooltips, comes from Radix primitives. Variants are declared once with class-variance-authority.',
        tradeoff:
          'Radix is a dependency every copied file shares, and its portalled parts render outside the component’s own container.',
      },
      {
        title: 'Blocks are controlled, with every state explicit',
        rationale:
          'Page-level blocks take a loading, error, or ready state and the current time as props, keep example data in separate files, and reflow with container queries. They never fetch, read the clock, or persist anything.',
        tradeoff:
          'A few parts still follow the window rather than the container: the detail panel and the table’s hide-below columns.',
      },
      {
        title: 'Shared interaction states',
        rationale:
          'Focus rings and disabled styling are defined once as utilities, so every interactive element looks and behaves the same way.',
        tradeoff:
          'Changing a shared state changes every component at once, so the change has to be checked everywhere.',
      },
    ],
    architecture: {
      summary:
        'Tokens at the bottom, primitives and blocks above them, and a registry that describes them. The site reads the registry, and a project copies only the files it needs.',
      parts: [
        {
          name: 'Design tokens',
          responsibility:
            'Colour and layout tokens for both themes, and the shared interaction utilities.',
          path: 'src/styles/globals.css',
        },
        {
          name: 'Components',
          responsibility: 'Accessible primitives and small composed parts.',
          path: 'src/components/ui/button.tsx',
        },
        {
          name: 'Blocks',
          responsibility: 'Components composed into patterns and page-level screens.',
          path: 'src/components/blocks/dashboard-overview.tsx',
        },
        {
          name: 'Registry',
          responsibility:
            'The typed description of each entry, with its examples, API, and install details.',
          path: 'src/registry/index.ts',
        },
        {
          name: 'Validation',
          responsibility: 'Checks that metadata and install steps match the source.',
          path: 'src/registry/validate.ts',
        },
      ],
    },
    challenges: [
      {
        challenge: 'Contrast can regress silently when a token changes.',
        solution:
          'A unit test converts each OKLCH token to relative luminance and checks every text pair and the focus ring against the WCAG thresholds, in both themes, on every run.',
        evidence: [
          { label: 'Contrast test', path: 'src/styles/tokens.test.ts', anchor: 'contrast' },
          { label: 'The tokens', path: 'src/styles/globals.css', anchor: '@theme inline' },
        ],
      },
      {
        challenge:
          'A token name can collide across Tailwind’s utility namespaces and produce the wrong utility.',
        solution: 'A test fails when a colour name is reused for another utility namespace.',
        evidence: [
          {
            label: 'Token name test',
            path: 'src/styles/tokens.test.ts',
            anchor: 'never reuse a color name',
          },
        ],
      },
      {
        challenge: 'Install instructions drift from what a file actually imports.',
        solution:
          'The registry validator compares each entry’s declared packages and dependencies with the source’s imports and fails on any difference.',
        evidence: [
          {
            label: 'The validator',
            path: 'src/registry/validate.ts',
            anchor: 'parseSourceImports',
          },
          {
            label: 'Its test',
            path: 'src/registry/validate.test.ts',
            anchor: 'detects install steps that drift',
          },
        ],
      },
      {
        challenge: 'Page blocks break when they are copied into another project or resized.',
        solution:
          'Blocks are single files with an allowed set of imports, and a test checks every page block against rules: container queries, no window or clock reads, no network calls, and no raw palette colours.',
        evidence: [
          {
            label: 'Page block rules',
            path: 'src/registry/page-blocks.test.ts',
            anchor: 'forbiddenInSource',
          },
          { label: 'The shared rule list', path: 'src/test/source-rules.ts' },
        ],
      },
      {
        challenge: 'Overlays have to follow the theme of the frame they are shown in.',
        solution:
          'The playground scopes its preview theme to the frame and opens dialogs inside it, and end-to-end tests check both directions.',
        evidence: [
          {
            label: 'Frame theme tests',
            path: 'e2e/playground.spec.ts',
            anchor: 'the preview theme is scoped to the frame',
          },
        ],
      },
    ],
    media: [
      {
        kind: 'registry-example',
        entry: 'dashboard-overview',
        entryKind: 'block',
        example: 'overview',
        caption:
          'A page-level block with example data. Use the width switcher: it reflows with its container, not the window.',
      },
      {
        kind: 'registry-example',
        entry: 'tabs',
        entryKind: 'component',
        example: 'line',
        caption: 'A component built on Radix with a variant helper.',
      },
      {
        kind: 'route-link',
        href: '/components',
        label: 'Components',
        description: 'Every component, with examples, props, and source.',
      },
      {
        kind: 'route-link',
        href: '/blocks',
        label: 'Blocks',
        description: 'Components composed into patterns and page-level screens.',
      },
      {
        kind: 'route-link',
        href: '/docs/theming',
        label: 'Theming docs',
        description: 'The tokens, the themes, and the shared states.',
      },
      {
        kind: 'route-link',
        href: '/templates',
        label: 'Templates',
        description: 'Example apps that combine the blocks.',
      },
    ],
    repository: thisRepository,
    deployment: notDeployed,
    limitations: [
      'Props tables are written by hand and can drift from the component types.',
      'The contrast test checks token pairs, not every rendered combination: opacity modifiers and text over images are outside its reach.',
      'OKLCH colours have no fallback for older browsers.',
      'There is no package, versioning, or changelog, so a copied file does not receive later fixes.',
      'There is no visual regression testing and no automated accessibility scan.',
      'A few parts follow the window width rather than their container: the detail panel and the table’s hide-below columns.',
      'Only light and dark themes exist.',
      'Combobox is planned and not built.',
    ],
    improvements: [
      'Derive props tables from component types.',
      'Add a fallback strategy if older browsers need to be supported.',
      'Add visual regression and automated accessibility checks.',
      'Make the remaining window-dependent parts follow their container.',
    ],
    relatedCaseStudies: ['contrast-tested-design-system'],
  },
  {
    visibility: 'public',
    slug: 'geospatial-3d-experiments',
    category: 'experiment',
    title: 'Map projections and a WebGL scene, written from first principles',
    summary:
      'Two browser experiments built without a map or 3D library: the maths of three map projections drawn as SVG, and a lit cube in raw WebGL2 that respects reduced motion.',
    role: 'Design and implementation (single author)',
    period: '2026',
    stack: ['TypeScript', 'WebGL2', 'SVG', 'React', 'Vitest'],
    problem: [
      'Map and 3D libraries hide the mathematics and the browser APIs they are built on, which makes distortion and the GPU’s resource lifecycle hard to see.',
      'Interactive graphics are also easy to make inaccessible: motion that cannot be paused, a canvas with no text alternative, and no behaviour when WebGL is missing.',
    ],
    scope: {
      summary: 'Two self-contained demos, with their maths covered by unit tests.',
      includes: [
        'Equirectangular, Web Mercator, and orthographic projections as pure functions',
        'A graticule and city markers drawn as SVG, with a data table as a text alternative',
        'A lit cube drawn with raw WebGL2 shaders and a small matrix module',
        'Motion, visibility, and fallback handling',
      ],
      excludes: [
        'Map tiles, coastlines, or country borders',
        'A map library such as MapLibre, which is planned and not built',
        'Model loading, or any scene beyond one cube',
      ],
    },
    decisions: [
      {
        title: 'Projections are pure functions',
        rationale:
          'Each projection maps longitude and latitude to a point, or to null when the point is not visible. Drawing is separate, so the maths can be tested without a DOM.',
        tradeoff: 'Only a graticule and a few cities are projected: there is no coastline data.',
      },
      {
        title: 'SVG rather than a canvas or tiles',
        rationale:
          'SVG keeps the map themeable with the site’s colour tokens and keeps each element inspectable, with no tile server and no extra download.',
        tradeoff: 'It suits a small number of shapes. A dense map would need a canvas or WebGL.',
      },
      {
        title: 'A data table beside the map',
        rationale:
          'The same projected points are listed in a table, so the information is available without seeing the drawing.',
        tradeoff: 'The table repeats the data and has to be kept in step with the map.',
      },
      {
        title: 'Raw WebGL2 with a small tested matrix module',
        rationale:
          'Shaders, buffers, and the model and perspective matrices are written by hand, so the whole pipeline is visible. The matrix maths is in a separate module with unit tests.',
        tradeoff: 'A larger scene would call for a library. This one has a single object.',
      },
      {
        title: 'Motion is opt-in when the system asks for less',
        rationale:
          'The scene starts paused when reduced motion is requested and has an explicit Play control. The animation loop runs only while the scene is playing, on screen, and in a visible tab.',
        tradeoff:
          'A user who has asked for reduced motion sees a still frame until they press Play.',
      },
      {
        title: 'The scene follows the theme',
        rationale:
          'The cube’s colour is read from the --primary token and updated when the theme changes, so it matches the rest of the site.',
        tradeoff:
          'It depends on that token being a colour the converter understands. Otherwise it keeps its default colour.',
      },
    ],
    architecture: {
      summary:
        'Each experiment is a lazy React component over plain TypeScript modules: the projection maths and the WebGL scene have no React in them.',
      parts: [
        {
          name: 'Projection maths',
          responsibility:
            'Three projections, graticule paths, and the scale factor, as pure functions.',
          path: 'src/lab/map-projections/projection.ts',
        },
        {
          name: 'Map rendering',
          responsibility: 'Draws projected points and paths as SVG.',
          path: 'src/lab/map-projections/map-svg.tsx',
        },
        {
          name: 'Map demo',
          responsibility: 'The controls, the projection switch, and the data table.',
          path: 'src/lab/map-projections/map-projections-demo.tsx',
        },
        {
          name: 'Matrix module',
          responsibility: 'The matrix maths for the cube, with its own tests.',
          path: 'src/lab/webgl-scene/mat4.ts',
        },
        {
          name: 'WebGL scene',
          responsibility: 'Creates the context, shaders, and buffers, renders, and releases them.',
          path: 'src/lab/webgl-scene/scene.ts',
        },
        {
          name: 'Scene demo',
          responsibility:
            'Play and pause, reduced motion, visibility, theme colour, and the fallback.',
          path: 'src/lab/webgl-scene/webgl-scene-demo.tsx',
        },
        {
          name: 'Lazy loading',
          responsibility: 'Each demo is split into its own chunk and loaded when its page opens.',
          path: 'src/lab/index.ts',
        },
      ],
    },
    challenges: [
      {
        challenge: 'The far side of the globe must not be drawn on the orthographic map.',
        solution:
          'The orthographic projection returns null for a point on the far side, and path building splits lines where points are hidden.',
        evidence: [
          { label: 'The cull', path: 'src/lab/map-projections/projection.ts', anchor: 'cosC < 0' },
          {
            label: 'Culling test',
            path: 'src/lab/map-projections/projection.test.ts',
            anchor: 'culls the far side of the globe',
          },
          {
            label: 'Split paths test',
            path: 'src/lab/map-projections/projection.test.ts',
            anchor: 'splits paths where points are hidden',
          },
        ],
      },
      {
        challenge: 'Web Mercator stretches without limit towards the poles.',
        solution:
          'Latitude is clamped where the projected map becomes square, and the east–west scale factor is shown beside each city so the distortion is visible.',
        evidence: [
          {
            label: 'The clamp',
            path: 'src/lab/map-projections/projection.ts',
            anchor: 'MERCATOR_MAX_LAT',
          },
          {
            label: 'Clamp test',
            path: 'src/lab/map-projections/projection.test.ts',
            anchor: 'is square at the latitude limit and clamps beyond it',
          },
          {
            label: 'Scale factor in the demo',
            path: 'src/lab/map-projections/map-projections-demo.test.tsx',
            anchor: '×2.29',
          },
        ],
      },
      {
        challenge: 'GPU buffers leak and contexts get lost unless they are handled.',
        solution:
          'The scene deletes its buffers when it is disposed, and it listens for a lost context and tells the page, which then explains what happened.',
        evidence: [
          {
            label: 'Context loss and cleanup',
            path: 'src/lab/webgl-scene/scene.ts',
            anchor: 'webglcontextlost',
          },
          {
            label: 'Cleanup test',
            path: 'src/lab/webgl-scene/webgl-scene-demo.test.tsx',
            anchor: 'releases GPU resources on unmount',
          },
        ],
      },
      {
        challenge:
          'Animation has to respect a request for reduced motion, and not run when nobody can see it.',
        solution:
          'The scene starts still under reduced motion until Play is pressed, and the loop only runs while playing, on screen, and in a visible tab. A browser-level test emulates reduced motion.',
        evidence: [
          {
            label: 'Play, visibility, and theme logic',
            path: 'src/lab/webgl-scene/webgl-scene-demo.tsx',
            anchor: 'IntersectionObserver',
          },
          {
            label: 'Unit test',
            path: 'src/lab/webgl-scene/webgl-scene-demo.test.tsx',
            anchor: 'starts still under reduced motion until the user presses Play',
          },
          {
            label: 'End-to-end test',
            path: 'e2e/smoke.spec.ts',
            anchor: 'the WebGL scene starts still under reduced motion',
          },
        ],
      },
      {
        challenge:
          'WebGL is not always available, for example in headless browsers or when the driver drops it.',
        solution:
          'The scene reports when it cannot create a context, and the page shows an explanation instead of a blank canvas.',
        evidence: [
          {
            label: 'Fallback test',
            path: 'src/lab/webgl-scene/webgl-scene-demo.test.tsx',
            anchor: 'explains when WebGL is unavailable',
          },
        ],
      },
    ],
    media: [
      {
        kind: 'lab-demo',
        slug: 'map-projections',
        caption:
          'The map projection explorer, running here. Switch projections, turn the globe with the sliders, and compare the table.',
      },
      {
        kind: 'lab-demo',
        slug: 'webgl-scene',
        caption:
          'The WebGL scene, running here. Pause it, or ask your system for reduced motion and reload.',
      },
      {
        kind: 'route-link',
        href: '/labs/maps/map-projections',
        label: 'Map projection explorer page',
        description: 'The experiment on its own page, with how it works.',
      },
      {
        kind: 'route-link',
        href: '/labs/3d/webgl-scene',
        label: 'WebGL scene page',
        description: 'The experiment on its own page, with motion and fallbacks explained.',
      },
    ],
    repository: thisRepository,
    deployment: notDeployed,
    limitations: [
      'There are no coastlines or borders: the map shows a graticule and city markers.',
      'Only three projections are implemented.',
      'The 3D scene is a single cube.',
      'The globe turns with sliders only: there is no pointer-drag rotation.',
      'When WebGL is unavailable, the fallback is a message rather than an alternative rendering.',
      'MapLibre is planned for a comparison and not built.',
    ],
    improvements: [
      'Add pointer-drag rotation to the globe.',
      'Add more projections.',
      'Add public-domain coastlines after checking their license.',
      'Build a MapLibre version to compare against.',
    ],
  },
]

/**
 * What "Public project" means, shown on the projects page and on each project. It names no one:
 * private professional work is simply not published here.
 */
export const projectPolicy = {
  title: 'What “Public project” means',
  paragraphs: [
    'A public project has its source in a GitHub repository under the author’s own account, and everything shown for it is public: its code, its tests, and any demo you can run on this site.',
    'Private professional work, including code and data that belong to an employer or a client, is not published here, so it has no entry on this page.',
  ],
} as const

export function getShowcaseProject(slug: string): ShowcaseProject | undefined {
  return showcaseProjects.find((project) => project.slug === slug)
}

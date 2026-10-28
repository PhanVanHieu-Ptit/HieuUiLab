# Known limitations

What 0.1.0 does not do, did not check, or does in a way that a visitor or a contributor could trip over. The release audit found each of these and chose not to fix it before the first version. Each item says where it is and what would settle it. [Release readiness](/docs/release-readiness) lists what was verified; this page lists what was not.

## Not verified {#not-verified}

- **No deployment.** The site has never been deployed. A Vercel build with pnpm 11, how Vercel applies `vercel.json` and sends its headers, preview protection, a custom domain, and the workflow `.github/workflows/deploy-verify.yml` have not run. The local rehearsal in [Reproduce the quality checks](/docs/reproducing-checks#rehearsal) shows the configuration is consistent, not that a host honors it. [Deployment](/docs/deployment) has the steps for the first deployment.
- **No run on GitHub.** The checks were run on one machine with Node.js 24. This audit did not observe the CI workflow on GitHub for the audited commit. Whether the Chromium that GitHub provides can create a WebGL2 context is unconfirmed; with `CI` set, the map and 3D specs fail without it (`e2e/fixtures.ts`), and the fix would be browser launch arguments, not skipping.
- **One browser.** Playwright runs Chromium only. Firefox and WebKit are not tested. No screen reader, browser zoom, or forced-colors test runs, and touch is emulated.
- **No field data.** `pnpm perf:measure` makes lab runs on one machine and its results are not committed, so the repository makes no performance claim. The build warns about two chunks over 500 kB, the Three.js scene runtime and the MapLibre worker. Each is downloaded only by the page that uses it.
- **No online map provider.** The map viewer's bundled basemap is tested. The opt-in online basemap needs a style URL and, for most providers, a key, and no provider was used. See [Map viewer and basemaps](/docs/map-viewer).
- **Code similarity to other libraries was not audited.** The components follow the conventions of shadcn/ui and Radix UI. The audit checked licenses and imports, not whether any file resembles another project's source.

## Accessibility {#accessibility}

- **Form control borders are faint.** The `--input` border of Input, Select, and Textarea measures 1.39:1 against the page background in the light theme and 1.65:1 in the dark theme (`src/test/color.ts`, the same arithmetic as `src/styles/tokens.test.ts`). WCAG 2.1 success criterion 1.4.11 asks for 3:1 where the border is what shows the control. Axe does not test it. The focus ring is 4.89:1 and 7.67:1, so a focused control is clear. Darkening `--input` changes how every form looks, so the audit left the choice to the owner of the design.
- **Axe covers a list of states.** It scans the states in `e2e/a11y.spec.ts` in both themes, in Chromium. The lab demos themselves, most docs pages, and most registry entries are not scanned. A clean scan does not show that a page is accessible. See [Accessibility](/docs/accessibility).
- **Search finds docs only.** The ⌘K palette is scoped to the documentation navigation (`src/components/site/command-menu.tsx`) although its button says "Search docs". Labs, projects, notes, and the About page are not in it.
- **Header links hide at some widths.** Templates is hidden from the header below 1024 pixels and About below 1280 (`headerFrom` in `src/config/site.ts`). The drawer that lists them exists only below 768 pixels, so between 768 and 1279 pixels they are reachable from the footer, and Templates from the docs sidebar.
- **The `/` shortcut ignores modifiers.** Ctrl+/ and Alt+/ also open the search, and nothing stops it while a dialog is open (`src/components/site/site-layout.tsx`).
- **The sidebar landmark is named "Registry"** although it also holds docs and tools (`src/components/site/site-sidebar.tsx`).

## Behavior {#behavior}

- **A loader that fails reads as "not found" in the head.** If an entry's loader rejects, the page body says something went wrong but the title is "Page not found" and the page is marked `noindex` (`src/router/meta.ts`).
- **An unknown stored theme is handled twice.** The script in `index.html` shows the light theme for a value it does not know, and `src/hooks/use-theme.ts` reads the same value as System, so on a dark system the page is light while the menu says System. A second tab does not follow a theme change; there is no `storage` listener.
- **Playground state is not in the URL.** Only `?example=` is, so a configuration cannot be linked.
- **Metadata is applied in the browser.** A crawler that does not run JavaScript sees the defaults from `index.html`. There is no `og:image`, canonical link, `robots.txt`, or sitemap.

## Component API {#api}

These are costly to change after people depend on them, which is why they are listed.

- **`default` and `neutral` both mean "no emphasis".** Button and Card use `default`; Badge, Alert, and StatusBadge use `neutral`. The failing variant is `destructive` everywhere since the audit renamed StatusBadge's `danger`.
- **Not every component exports a props type.** One that takes only the native element's props, such as Kbd, Skeleton, Separator, and the parts of Table, exports none. [Component conventions](/docs/component-conventions) says so.
- **Some text is English only.** "Close" in Dialog and Sheet, "Previous page" and "Next page" in Pagination, and "Unread" and "Mark as read" in NotificationItem are fixed strings. A prop for each can be added without a breaking change.
- **`SearchInput`'s clear button needs a controlled value.** With only `defaultValue` it never shows and Escape does not clear (`src/components/ui/search-input.tsx`).
- **`SheetContent` has no `container` or close-button option**, which `DialogContent` has. The template pages note that overlays render on the page, not inside the preview frame.
- **Most page blocks take explicit props only.** They do not spread native attributes or accept a `ref`, and `ProfileForm` and `SearchFilterForm` have no `className`. Adding props later does not break callers.
- **Props tables are written by hand.** `src/registry/props-drift.test.ts` checks that every prop a `<Part>Props` interface declares is documented. It cannot see a documented prop that was removed, a part without such an interface, or a changed type.
- **The playground's Dialog and Data table snippets are strings.** The tests check their imports against the exports; nothing type-checks the generated code. They were checked by hand against the components for this release.

## Registry and distribution {#registry}

- **One item is published.** Kbd is the only item in `public/r`, and nothing is published to npm. The package is private.
- **The published Kbd depends on the npm package `cn`.** shadcn's own current items import from it too (checked on 2026-10-27 in the Button item at `https://ui.shadcn.com/r/styles/new-york-v4/button.json`), the package is maintained by shadcn and MIT licensed, and the install tests pass with it. The name belonged to an unrelated package first published in 2013, and shadcn's versions start on 2026-09-01. The dependency has no version range, so a project that installs the item trusts whoever publishes `cn`.
- **No CORS header on `/r/*.json`.** The shadcn CLI runs in Node.js and does not need one. A browser page that fetched the registry from another origin would.
- **The install tests ran with pnpm and npm on one CLI version.** Other versions, runners, and frameworks are untested ([Install with the shadcn CLI](/docs/shadcn-registry)).

## Security and privacy {#security}

- **No Content-Security-Policy and no HSTS in `vercel.json`.** The inline script that sets the theme before first paint and the opt-in map connection make a strict policy a design task. What Vercel sends for HSTS by default was not checked. `vercel.json` does set `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy`.
- **Workflow actions are pinned by major tag**, not by commit, and there is no Dependabot configuration, so an action or a package moves only when someone updates it. The audit found no known vulnerability in the production dependencies (`pnpm audit --prod`, 2026-10-27).
- **The git history holds two email addresses.** Author metadata on 25 commits shows two addresses that are not GitHub noreply addresses, and the repository is public. Rewriting history would not remove copies already made. [Release readiness](/docs/release-readiness#checklist) lists the decision.
- **No security policy.** There is no `SECURITY.md` and no issue templates. `CONTRIBUTING.md` asks reporters not to describe a vulnerability in a public issue.
- **The text of every license is from the installed packages**, copied into `THIRD-PARTY-NOTICES.md` once. A dependency update that changes a copyright line is caught only when its license changes.

## Process {#process}

- **No `.nvmrc`.** The Node.js version is in `engines` and the workflows.
- **No tag, no release, no changelog date for 0.1.0.** The version section of `CHANGELOG.md` has no date until a tag exists.

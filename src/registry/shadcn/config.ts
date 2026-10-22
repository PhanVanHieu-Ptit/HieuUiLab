/**
 * Settings for publishing registry entries as shadcn registry items. Everything that decides what
 * is published, and against which CLI that claim was tested, lives here.
 */

/**
 * The only shadcn CLI version the install test has run against, and the only one the docs claim.
 * `pnpm registry:install-test` runs exactly this version; a test keeps it equal to the `shadcn`
 * devDependency. Raise it only after the install test passes on the new version.
 */
export const TESTED_CLI = '4.22.1'

/** The registry's own name, written to `public/r/registry.json`. */
export const REGISTRY_NAME = 'hieu-ui-lab'

/** The namespace the docs tell consumers to register: `shadcn registry add @hieuuilab=...`. */
export const NAMESPACE = '@hieuuilab'

/** Where the generated files are served from, relative to the site root. */
export const REGISTRY_URL_PATH = '/r'

export const REGISTRY_ITEM_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry-item.json'
export const REGISTRY_SCHEMA_URL = 'https://ui.shadcn.com/schema/registry.json'

/**
 * Slugs published to the shadcn registry. Publishing another entry is a deliberate act: add the
 * slug, run `pnpm registry:build`, and pass the install test for it (see the docs page).
 */
export const publishedSlugs: readonly string[] = ['kbd']

/**
 * Packages the emitted source imports but this site does not install. The emit step rewrites
 * the site's own `cn` helper to shadcn's `cn` package, which is what shadcn's own items import.
 */
export const consumerPackages: readonly string[] = ['cn']

/** Source import rewritten to a package import in the emitted file, because a consumer has no `@/lib/cn`. */
export const CN_SOURCE_IMPORT = '@/lib/cn'
export const CN_PACKAGE = 'cn'

/**
 * Names of the `registry:ui` items in shadcn's own registry, as listed by
 * https://ui.shadcn.com/r/index.json on 2026-10-22. `shadcn add <name>` resolves a bare name to
 * these, so a published item with one of these names is easy to install by mistake. Publishing
 * one is allowed only when it is also listed in `shadowsBuiltin`.
 */
export const shadcnBuiltinUi: ReadonlySet<string> = new Set(
  (
    'accordion alert alert-dialog aspect-ratio attachment avatar badge breadcrumb bubble ' +
    'button button-group calendar card carousel chart checkbox code-block collapsible ' +
    'combobox command context-menu dialog direction drawer dropdown-menu empty field form ' +
    'hover-card input input-group input-otp item kbd label marker menubar message ' +
    'message-scroller native-select navigation-menu pagination popover progress questionnaire ' +
    'radio-group resizable scroll-area select separator sheet sidebar skeleton slider sonner ' +
    'spinner switch table tabs textarea toast toggle toggle-group tooltip trace'
  ).split(' '),
)

/**
 * Published items that share a name with a shadcn item, acknowledged on purpose. The docs for
 * these must install them by URL or namespace only, never by bare name.
 */
export const shadowsBuiltin: readonly string[] = ['kbd']

/**
 * Color tokens a project created by `shadcn init` defines, read from the `@theme inline`
 * block that `init -t vite` wrote on 2026-10-22 (CLI 4.22.1, radix-nova preset). A published entry
 * may use these and nothing else from the site's own stylesheet.
 */
export const shadcnTokens: ReadonlySet<string> = new Set(
  (
    'background foreground card card-foreground popover popover-foreground primary ' +
    'primary-foreground secondary secondary-foreground muted muted-foreground accent ' +
    'accent-foreground destructive border input ring chart-1 chart-2 chart-3 chart-4 chart-5 ' +
    'sidebar sidebar-foreground sidebar-primary sidebar-primary-foreground sidebar-accent ' +
    'sidebar-accent-foreground sidebar-border sidebar-ring'
  ).split(' '),
)

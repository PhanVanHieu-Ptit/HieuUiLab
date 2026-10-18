# Design tokens

Every color, radius, shadow, type size, and motion curve in the interface comes from a design token defined once in `src/styles/globals.css`. Components use only the semantic utilities these tokens create, such as `bg-surface` and `text-muted-foreground`, and never raw palette colors such as `bg-blue-600`. The tables below are generated from the stylesheet, so the values and names are always the ones in use. [Theme customization](/docs/theming) covers changing them, and [Installation](/docs/installation#tokens) says which parts to copy into your own project.

## How tokens become utilities {#how}

Raw values are variables declared on `:root` and `.light` for the light theme and on `.dark` for the dark theme. `@theme inline` maps each one to a Tailwind utility, so `--surface` becomes `bg-surface`, `text-surface`, and `border-surface`. The `@theme` block holds the theme-independent tokens: fonts, type sizes, spacing, containers, and animations. Spacing otherwise uses Tailwind's default scale, with a `0.25rem` base.

Neutrals sit on hue 260 with low chroma, and the primary color, on hue 264, is the single accent. Status colors (`success`, `warning`, `info`, `destructive`) are reserved for status, not decoration.

## Color {#color}

Each fill has a matching `-foreground` for text drawn on it. The swatches read the live variable, so they follow the theme the page is in. Every text pair, and the focus ring against each surface, is contrast-tested in both themes; see [Accessibility guidelines](/docs/accessibility#checks).

::design-tokens{group="color"}

## Radius {#radius}

One variable, `--radius`, sets the base corner radius, and the scale is derived from it. Use the utilities `rounded-sm`, `rounded-md`, `rounded-lg`, and `rounded-xl`.

::design-tokens{group="radius"}

## Elevation {#elevation}

The two shadow tokens have different values in the light and dark themes.

::design-tokens{group="elevation"}

## Stacking {#stacking}

Layers are numbers used as `z-(--z-header)`, `z-(--z-overlay)`, and `z-(--z-popover)`.

::design-tokens{group="stacking"}

## Typography {#typography}

Interface text uses `font-sans` and code uses `font-mono`. The named sizes carry their own line height, letter spacing, and weight, shown after each value.

::design-tokens{group="typography"}

## Layout {#layout}

Spacing and container tokens name the recurring page dimensions. They create utilities such as `px-gutter`, `py-section`, `h-header`, `top-header`, `w-sidebar`, `max-w-page`, `max-w-content`, and `max-w-sheet`.

::design-tokens{group="layout"}

## Motion {#motion}

The animations used by dialogs, sheets, menus, and tooltips. Under `prefers-reduced-motion`, a rule in the stylesheet collapses all animation and transition durations.

::design-tokens{group="motion"}

## Interaction state utilities {#states}

Hover, focus, pressed, disabled, and loading look the same everywhere because components share these rules. Hover uses `hover:bg-accent`, or a `/90` fill on solid buttons. A pressed button gets `active:` styles and a 1px nudge. Loading uses `Spinner` or `Button loading`, which sets `aria-busy`.

::design-tokens{group="utilities"}

## Naming a new token {#naming}

Name tokens so they do not collide across utility namespaces. `--text-code` next to `--color-code` once made `text-code` paint text in the code background color, and `src/styles/tokens.test.ts` now fails on such clashes. A new token also needs a usage line in `src/docs/token-docs.ts`; its test fails until it has one.

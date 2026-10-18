# Theme customization

Every color, surface, and interaction state comes from semantic tokens defined once in `src/styles/globals.css`. Components never use raw palette values, so changing a token changes the whole interface. This page covers choosing a theme, changing a token, and what is not customizable.

## Theme preference {#preference}

The header theme menu offers Light, Dark, and System. The choice is stored in `localStorage` under the key `hieu-ui-lab:theme` and applied before first paint. System follows the operating system setting and updates live when it changes. The same choice, as a control on the page:

::theme-switcher

## How the theme is applied {#mechanism}

The theme is a class on `<html>`. The light values are declared on `:root` and `.light`, and the dark values on `.dark`; `@theme inline` maps them to Tailwind utilities. Two pieces of site code toggle the class:

- an inline script in `index.html` reads the stored choice, falls back to `prefers-color-scheme`, and sets the class before the page paints, so there is no flash;
- the `useTheme` hook in `src/hooks/use-theme.ts` changes it afterwards. It keeps the choice in a module-level store that components read with `useSyncExternalStore`, so there is no provider to mount, and it listens for operating system changes while the choice is System.

Both treat unavailable storage (private mode, blocked site data) as System, and the choice still applies for the session.

## Scoped themes {#scoped}

`.dark` and `.light` each re-declare the tokens, so they work on any element, not only on `<html>`. A region can be light inside a dark page; the playground preview uses this. Components read tokens through `var(--token)` where they are used, so they follow the nearest scope. The shared `focus-ring` utilities read `--ring` directly for the same reason.

## Change a token {#change}

1. Edit the value in both the `:root, .light` block and the `.dark` block of `src/styles/globals.css`.
2. Run the unit tests. `src/styles/tokens.test.ts` checks WCAG AA contrast for every text pair in both themes, 4.5:1 for text and 3:1 for the focus ring on each surface. If a change fails it, adjust the lightness until it passes; do not loosen the test.
3. To add a color, declare `--name` in both blocks, add `--color-name: var(--name)` to `@theme inline`, and add a usage line for it in `src/docs/token-docs.ts`. The tests fail until the last step is done, so the [Design tokens](/docs/design-tokens) page never has an undescribed row.

Name new tokens so they do not collide across utility namespaces. `--text-code` next to `--color-code` once made `text-code` paint text in the code background color, and `tokens.test.ts` now fails on such clashes.

## Radius and fonts {#radius-fonts}

All corner radii derive from one variable, `--radius`: `--radius-sm` is two pixels smaller, `--radius-lg` four pixels larger, and `--radius-xl` eight pixels larger. Changing `--radius` rescales every component. The fonts are `--font-sans` and `--font-mono` in the `@theme` block; [Installation](/docs/installation#fonts) says how this site loads them.

## What is not customizable {#limits}

- There is no `ThemeProvider` component and no theme prop on components.
- There is no density option. Spacing uses Tailwind's default scale (a `0.25rem` base) plus the named layout tokens.
- `--radius` is the only shape control. Colors, shadows, and type sizes change by editing their own tokens.

To use these tokens in your own project, follow [Installation](/docs/installation#tokens) and [dark mode](/docs/installation#dark-mode).

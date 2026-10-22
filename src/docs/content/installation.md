# Installation

Entries are written for React 19 with TypeScript and Tailwind CSS v4. There is no package to install: you copy each entry's file into your project and own it from then on. One entry, Kbd, is also published for the shadcn CLI, which [Install with the shadcn CLI](/docs/shadcn-registry) covers. Nothing tracks a copied file against the entry it came from.

Set the project up once with steps 1 to 5, then copy as many entries as you need with step 6.

## 1. Add the tokens and state utilities {#tokens}

Components style themselves only through semantic Tailwind utilities such as `bg-surface`, `text-muted-foreground`, and `border-border`, plus three shared state utilities. Copy these parts of `src/styles/globals.css` into your global stylesheet, after `@import 'tailwindcss'`:

- the `:root, .light` block and the `.dark` block, which hold the light and dark values;
- the `@theme inline` block, which turns those variables into Tailwind utilities;
- the `@theme` block, which holds the fonts, type sizes, spacing, containers, and the animations dialogs and menus use;
- the three `@utility` rules: `focus-ring`, `focus-ring-inset`, and `disabled-state`;
- in `@layer base`, the rule `* { @apply border-border; }`. Entries write `border` without a color and rely on it; without it, Tailwind v4 draws borders in the current text color.

Also copy the `prefers-reduced-motion` rule in `@layer base` if you want animations and transitions to collapse for people who ask for less motion. [Design tokens](/docs/design-tokens) lists every token, and [Theme customization](/docs/theming) covers changing them.

## 2. Install the fonts {#fonts}

`--font-sans` and `--font-mono` in the `@theme` block name IBM Plex Sans Variable and JetBrains Mono Variable, followed by system fallbacks. This site installs both from Fontsource and imports them once, in `src/main.tsx`. Entries do not import fonts themselves, so skip this step to use the system fonts.

```bash title="add the fonts"
pnpm add @fontsource-variable/ibm-plex-sans @fontsource-variable/jetbrains-mono
```

```tsx title="src/main.tsx"
import '@fontsource-variable/ibm-plex-sans'
import '@fontsource-variable/jetbrains-mono'
```

## 3. Switch dark mode on {#dark-mode}

The dark tokens apply under a `.dark` class, normally on `<html>`. No entry sets that class: the registry contains no theme toggle. This site sets it in two places, both site code and not registry entries: an inline script in `index.html` that applies the saved or system theme before first paint, and the `useTheme` hook in `src/hooks/use-theme.ts` that changes it afterwards. [Theme customization](/docs/theming) explains how both work.

If your app never shows a dark theme, skip this step; the light tokens are declared on `:root`.

## 4. Add the cn helper {#cn}

Every entry merges class names with `cn`, which it imports as `@/lib/cn`.

```bash title="add the cn dependencies"
pnpm add clsx tailwind-merge
```

::source{path="src/lib/cn.ts"}

## 5. Map the @ import alias {#alias}

Entries import shared code as `@/lib/cn` and `@/components/ui/…`. Point `@` at your source folder in TypeScript and in your bundler. This site does it as follows. `paths` resolves relative to the tsconfig file, so no `baseUrl` is needed (TypeScript 6 deprecates it).

```json title="tsconfig.json"
{
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```ts title="vite.config.ts"
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

## 6. Copy an entry {#copy}

Open the entry's page from [Components](/components) or [Blocks](/blocks). Its Installation section is generated from the entry's metadata and lists, in order:

1. the setup steps above that the entry needs;
2. the `pnpm add` command for the npm packages it imports;
3. the other registry entries it imports, which you copy first;
4. the path the file expects, followed by any notes.

Copy the source from the Source tab to that path. A validator keeps this list in step with what the file actually imports, so the list is safe to follow as written.

> [!NOTE]
> Blocks import components, and some import other blocks. Copy an entry's dependencies before the entry itself, or your editor will report missing modules.

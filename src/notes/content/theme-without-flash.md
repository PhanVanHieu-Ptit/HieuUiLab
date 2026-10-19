# Switching themes without a first-paint flash

## Context and problem

The site is a single-page application that the browser renders. The HTML that Vite serves is a shell with an empty root element, and every color on the page depends on one class: Tailwind's `dark` variant is declared against `.dark` on an ancestor, so the theme is whether `<html>` carries that class. A visitor chooses Light, Dark, or System, and the choice is kept in the browser.

If React applies that choice, the class arrives only after the JavaScript bundle has downloaded, parsed, and run. By then the browser has usually painted the page once in the default theme. A visitor who chose dark, or whose system is dark, would see a light page for a moment on every load, and then the page would flip. The problem is not how to store the choice. It is where the class on `<html>` gets set, and whether that can happen before the first paint.

## Constraints

There is no server rendering and no server-side session, so there is nothing to read the choice from except the browser. The only place it can live is `localStorage`.

Whatever runs before the first paint has to be small, synchronous, and independent of the bundle. It cannot import a module, so it cannot share code with the TypeScript that runs later, and it sits outside the type checker and ESLint. Storage can also throw: private browsing modes and blocked site data make `localStorage` access fail, and a broken theme script must not break the page. The System choice has to keep following the operating system while the page is open, and every component that reads the theme must agree on it without a provider component wrapped around the tree.

## Approach and alternatives considered

Four approaches were weighed.

1. **Apply the class from React.** This is the simplest, and it is what causes the flash. It was rejected because the flash is the problem being solved.
2. **Use only the `prefers-color-scheme` media query in CSS.** There is no script and no flash, but an explicit choice that differs from the operating system cannot be honored, and the components are written against the `.dark` class, not the media query.
3. **Hide the page until React has chosen a theme.** This avoids the wrong colors by replacing the flash with a blank screen, which delays the first paint instead of fixing its colors. It was not tried.
4. **Run a small inline script in the document head.** A classic script in `<head>` blocks parsing for a moment, runs before the body is painted, and can set the class synchronously. This is what the site does.

The React side then reads the same storage, but keeps its state in a module-level store that is read with `useSyncExternalStore`, rather than in a context provider. Any component can call the hook, all of them see one value, and no wrapper component is needed. The script decides the first paint, and the store keeps the interface in step afterwards.

## Implementation example

The pre-paint script is the whole of the first half. It reads the saved choice inside a `try` block, falls back to System, and toggles the class on the root element.

```text title="index.html (the pre-paint script)"
var theme = 'system'
try {
  theme = localStorage.getItem('hieu-ui-lab:theme') || 'system'
} catch (e) {}
var dark =
  theme === 'dark' ||
  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
document.documentElement.classList.toggle('dark', dark)
```

The hook module repeats the decoding in typed form. Reading the stored value validates it, and every change goes through one function that updates the store, toggles the class, and notifies subscribers.

```ts title="src/hooks/use-theme.ts (reading and applying the choice)"
function readStoredTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(value) ? value : 'system'
  } catch {
    return 'system'
  }
}
// …
function commit(next: ThemeState): void {
  state = next
  document.documentElement.classList.toggle('dark', next.resolvedTheme === 'dark')
  listeners.forEach((listener) => {
    listener()
  })
}
```

Components subscribe with `useSyncExternalStore`. The third argument is the snapshot to use where there is no browser, which keeps the hook usable outside one.

```ts title="src/hooks/use-theme.ts (the subscription)"
const current = useSyncExternalStore(
  subscribe,
  () => state,
  () => SERVER_STATE,
)
```

## Verification

Two kinds of check exist in the repository. The unit tests in `src/components/site/theme-menu.test.tsx` choose each theme through the real menu and assert the class on `<html>`, the stored value, and keyboard operation. The end-to-end test named "system follows the OS preference live and persists" in `e2e/shell.spec.ts` switches the emulated operating system preference while the page is open and reloads to confirm that the choice survives.

```bash title="Command: run the theme unit tests"
pnpm test src/components/site/theme-menu.test.tsx
```

```bash title="Command: run the theme end-to-end test"
pnpm test:e2e e2e/shell.spec.ts --grep "system follows the OS preference"
```

The script itself is not covered by either. It was exercised separately with a throwaway Node script of the shape below, which was not added to the repository. It extracts the inline script from `index.html` and runs it against stubbed storage and a stubbed media query. Nine combinations of stored value, system preference, and failing storage produced the expected class, with one exception described under the trade-offs.

```ts title="Hypothetical example: running the inline script against stubbed storage (a throwaway check, not in the repository)"
const html = readFileSync('index.html', 'utf8')
const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? ''

function isDark(stored: string | null, systemDark: boolean): boolean {
  const classes = new Set<string>()
  vm.runInNewContext(script, {
    localStorage: { getItem: () => stored },
    window: { matchMedia: () => ({ matches: systemDark }) },
    document: {
      documentElement: {
        classList: {
          toggle: (name: string, on: boolean) => {
            if (on) classes.add(name)
          },
        },
      },
    },
  })
  return classes.has('dark')
}
```

### What this does not verify

Nothing measures what is painted. Neither test captures a frame before the bundle runs, so the absence of a flash follows from the order of execution, a classic script in the head running before the body, and was not observed. The end-to-end sweeps set the stored value before the page loads and then check the class, which the React side would also produce, so they cannot tell the script from the hook. The page is not deployed, so behavior under a Content Security Policy that forbids inline scripts was not examined. No browser other than the Playwright default was used.

## Trade-offs and lessons learned

The decoding logic exists twice, once in the script and once in `readStoredTheme`, and the storage key is a string repeated in both places because the script cannot import the constant. Nothing checks that the two stay in step, and they already differ in one case. A stored value that is not Light, Dark, or System is treated as a missing choice by the hook, which then follows the system preference. The script treats it as an unknown theme and leaves the page light. With a stored value such as `purple` and a dark system, the script leaves the page light while the hook reports a resolved theme of dark. The app never writes such a value, so it can only appear if storage is edited by hand or corrupted, and it was left as it is. Making the script validate the value the same way would remove the difference.

The inline script also blocks parsing for as long as it runs, so it should stay small. It is formatted by Prettier like the rest of the file, but it is not type-checked.

A module-level store removes the provider, at the price of global state. The theme menu test resets the store in a `beforeEach` hook with a comment saying so, because state would otherwise leak between tests.

The lesson is that this kind of flash is an ordering problem, not a React problem. The fix is to decide the class before anything is painted, and then keep one source of truth for everything after that.

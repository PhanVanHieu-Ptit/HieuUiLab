# Respecting reduced motion beyond CSS

## Context and problem

Operating systems let a person ask for less motion, and browsers expose that request as the `prefers-reduced-motion` media query. A stylesheet can answer it for everything it controls: transitions, keyframe animations, and smooth scrolling. The site does that with one global rule.

That rule cannot reach motion that JavaScript drives. The WebGL experiment in the lab redraws a rotating cube from a `requestAnimationFrame` loop, and no media query stops a loop that a script keeps scheduling. The problem is to make script-driven motion honor the same request, including when the setting changes while the page is open, and to do it without turning the preference into a lock the visitor cannot open.

## Constraints

The preference has to be read in one place, so that every component that needs it agrees. It can change while the page is open, because an operating system setting can be toggled at any time, so a value read once at mount would go stale. The hook has to work in tests, where the browser's media query function is replaced by a stub, and it has to give a defined answer when there is no browser at all.

The demo has two more requirements that are not about the preference itself. It should not burn battery drawing a cube nobody can see, so it also stops when it scrolls out of view or the tab is hidden. And reduced motion should set a default, not remove a capability: someone who asked for less motion may still want to watch the cube turn.

## Approach and alternatives considered

The global CSS rule stays. It is cheap, it covers every transition and animation in the site, and it needs no code in components. Its weakness is exactly the scripted case, so something else has to cover that.

For the script side there were three options.

1. **Read the media query once, when the component mounts.** This is the least code, but the value goes stale if the setting changes while the page is open.
2. **Keep the value in state and update it from an effect.** This works, but it adds a state variable and an effect to every consumer, and unless the initial value is read during render it renders once with a guess.
3. **Subscribe with `useSyncExternalStore`.** The media query is an external source that can change, which is the case the hook exists for. React reads the value synchronously during render, and the subscription keeps it current.

The third option is what the hook does. The demo then treats the preference as a default. A piece of state holds the visitor's explicit choice and starts as `null`. While it is `null`, reduced motion decides whether the cube plays; once the visitor presses the button, their choice wins.

## Implementation example

The global rule shortens animations and transitions to a near-zero duration and stops them repeating. It does not remove them: it sets a very short duration instead.

```css title="src/styles/globals.css (the global rule)"
@media (prefers-reduced-motion: reduce) {
  *,
  ::before,
  ::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The hook subscribes to changes of the query and reads its current value as the snapshot.

```ts title="src/hooks/use-reduced-motion.ts (the hook)"
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(listener: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', listener)
  return () => {
    query.removeEventListener('change', listener)
  }
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches
}
// …
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
```

The demo combines the preference with the visitor's explicit choice. The comment in the source states the rule: nothing is decided until the visitor chooses.

```tsx title="src/lab/webgl-scene/webgl-scene-demo.tsx (default and override)"
// null until the user chooses; until then reduced motion decides.
const [playPreference, setPlayPreference] = useState<boolean | null>(null)
const playing = playPreference ?? !reducedMotion
```

The animation loop only runs when all three conditions hold: the scene is playing, it is in view, and the page is visible. In every other case a single still frame is rendered and no frame is requested.

```tsx title="src/lab/webgl-scene/webgl-scene-demo.tsx (when the loop runs)"
scene.render(angle.current)
if (!playing || !inView || !pageVisible) return
```

## Verification

The hook has two unit tests: the value is false when no preference is set, and it follows a change of the preference while mounted. The demo has a test that starts under reduced motion, checks that the status text says why the scene is paused, checks that a frame is drawn but none is requested, and then presses Play and checks that the loop starts.

```bash title="Command: run the reduced motion tests"
pnpm test src/hooks/use-reduced-motion.test.ts src/lab/webgl-scene/webgl-scene-demo.test.tsx
```

These tests rely on `src/test/media.ts`, a helper that replaces `matchMedia` and returns a function that changes the answer and notifies every listener.

### What this does not verify

The demo test replaces the scene with a stub and stubs `requestAnimationFrame`, so it shows that the loop is scheduled or not, not that anything is drawn. Pausing when the canvas scrolls out of view or the tab is hidden has no test. The global CSS rule has no test either, and nothing here was run against a real operating system setting in a real browser. The source does not say why the rule sets a tiny duration instead of removing animations, and that reason was not tested, so this note does not give one. The visitor's choice lives in component state only, so it is forgotten when the page is left.

## Trade-offs and lessons learned

Treating reduced motion as a default, not a prohibition, costs one extra piece of state and a status message that explains why the scene is still. In exchange the setting is respected without taking a choice away. It also means the preference alone is not the whole decision, so the logic is a little less obvious than a single boolean.

A subscription with `useSyncExternalStore` needs three small functions where an effect would need one, but it removes the wrong first render and works the same in every component that uses the hook. The server snapshot of `false` is there for completeness: this site has no server rendering, so that branch is not exercised.

The general lesson is that a stylesheet rule and a hook solve two different halves of one problem. A site that moves through both CSS and script needs both, and the CSS rule alone gives a false sense of coverage.

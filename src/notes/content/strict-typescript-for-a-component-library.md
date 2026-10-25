# Strict TypeScript for a component library

## Context and problem

The source in this repository is read by two audiences. The compiler reads it, and so does a person who copies a component into another project and then lives with its types. Types are the cheapest documentation a component has, and a strict configuration is how that documentation stays honest: it makes the compiler refuse the states a prop type only hints at.

Strictness also has a price. Optional props need a second thought, array reads need a branch, and every third-party type has to fit. The question this note answers is concrete: which strictness settings does the project use, what does each one catch in this code, what does it cost, and which checks are enforced by which tool. That last part matters more than it sounds, because a type-level test can sit in a test file and still not be run by the test runner.

## Constraints

The compiler is TypeScript 6.0.3, under the tilde range `~6.0.3` in `package.json`. The application and the tooling files are checked by two configurations, one for `src` and one for the configuration files and the end-to-end tests, and both turn on `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`. ESLint runs the type-aware strict rule sets with warnings counted as errors.

The code is copied into projects the author does not control. Code that is strict at the source should stay valid under a looser configuration, but that was not tested here. The library also wraps third-party types, mainly from Radix, so any rule that makes those awkward costs something in every component.

Finally, the checks have to run somewhere a contributor cannot skip. CI runs lint, the formatting check, the type check, the documentation and note checks, the unit tests, and the build, in that order.

## Approach and alternatives considered

**Which compiler options.** The project turns on `strict`, and also `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. The TypeScript reference lists neither of these two among the options that `strict` enables, so they are a deliberate step beyond it. `verbatimModuleSyntax` makes type-only imports explicit, and `noImplicitOverride` is on too. The alternative was `strict` alone, with less friction. Two things that were not adopted are the `erasableSyntaxOnly` option, which neither configuration sets, and branded types for identifiers, which were not found in the code that was read.

**Which lint rules.** `typescript-eslint` runs its strict and stylistic type-checked presets. `no-explicit-any` and `consistent-type-imports` are errors, and the lint script allows no warnings. The alternative, the plain recommended preset, was not tried.

**Make states unrepresentable.** Where a value can be in one of a few shapes, the code uses types instead of optional fields and runtime checks. A registry entry is either implemented, with source, examples, and install steps, or planned, with only a scope; a type guard narrows between them. The list of examples is a tuple with at least one member. A record keyed by every template slug turns a missing loader into a compile error. A helper that defines playground controls checks them against the component's own prop types.

**Test the types too.** Where a rule is "this must not compile", the test says so with `@ts-expect-error`, and uses `expectTypeOf` for the shape of a type. These sit in ordinary test files.

## Implementation example

The flags live in the application's configuration.

```json title="tsconfig.app.json (the strictness flags)"
"verbatimModuleSyntax": true,
"strict": true,
"noUncheckedIndexedAccess": true,
"exactOptionalPropertyTypes": true,
"noImplicitOverride": true,
```

With `exactOptionalPropertyTypes`, an optional property accepts a missing value but not an explicit `undefined`, unless the type says so. The page metadata type spells that out, and removing the annotation breaks a real caller, as the verification section shows.

```ts title="src/router/meta.ts (optional and explicitly undefined)"
  crumb?: string | undefined
  /** Crumbs between the parent route and this page, e.g. the entry's category in its catalog. */
  parents?: readonly Crumb[] | undefined
```

With `noUncheckedIndexedAccess`, reading an array position gives `T | undefined`, so the empty case needs handling. The form hook reads the first server error this way.

```tsx title="src/components/ui/form.tsx (an array read that may be empty)"
const [firstField] = fieldErrors
if (firstField) setFocusField({ name: firstField.name })
```

A registry entry is a union, and a type guard narrows it. Code that touches the install steps or the source has to prove the entry is implemented first. The guard is generic, so a list of entries whose content is loaded stays that type after `filter(isImplemented)`.

```ts title="src/registry/types.ts (a union and its guard)"
export type RegistryEntry = ImplementedEntry | PlannedEntry
// …
/** Narrows to the implemented entries, keeping whether their content is loaded. */
export function isImplemented<E extends RegistryEntry>(
  entry: E,
): entry is Extract<E, { status: ImplementedStatus }> {
  return entry.status !== 'planned'
}
```

The template loaders are a record over every slug, so the compiler is the checklist.

```ts title="src/templates/template-modules.ts (a loader for every slug)"
 * so nothing here reaches the landing page, navigation, or the other templates. The record type
 * makes adding a slug to `templateSlugs` without a loader a compile error.
 */
const loaders: Readonly<Record<TemplateSlug, () => Promise<TemplateModule>>> = {
```

The playground helper is generic over the component's props, and its test pins down what must not compile.

```ts title="src/registry/playground.ts (controls checked against props)"
export function definePlayground<P extends object>(
  component: ComponentType<P>,
  config: PlaygroundConfig<P>,
): RegistryPlayground {
```

```ts title="src/registry/playground.test.ts (a control that must not compile)"
definePlayground(Button, {
  part: 'Button',
  // @ts-expect-error -- Button has no `tone` prop.
  controls: [{ kind: 'select', prop: 'tone', options: ['info'], default: 'info' }],
})
```

## Verification

The type check, the lint run, and the tests that contain the type-level assertions are all repository commands.

```bash title="Command: run the type check, lint, and the type-level tests"
pnpm typecheck
pnpm lint
pnpm test src/registry/playground.test.ts src/playground/controls.test.ts
```

Several checks were run while writing this note, each on a throwaway change that was then reverted.

First, the effect of the optional-property annotation. Removing every `| undefined` from the page metadata type produced one compile error, in the route table where a handle is built from a navigation item whose description may be undefined. The annotations are doing work.

Second, the compiler messages. A throwaway file with deliberate mistakes was type-checked with TypeScript 6.0.3 and printed the messages below for the first three mistakes.

```ts title="Hypothetical example: a throwaway file with one deliberate mistake per flag (not in the repository)"
interface WithoutUndefined {
  crumb?: string
}
export const a: WithoutUndefined = { crumb: undefined }

const items: string[] = ['x']
const first = items[0]
export const b = first.toUpperCase()

export function sourceOf(entry: RegistryEntry): string {
  return entry.source
}
```

```text title="Hypothetical example: the compiler's messages for that file (reproduced once, not in the repository)"
TS2375: Type '{ crumb: undefined; }' is not assignable to type 'WithoutUndefined' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
TS18048: 'first' is possibly 'undefined'.
TS2339: Property 'source' does not exist on type 'RegistryEntry'.
```

Third, who enforces the type tests. The same file also held a valid line under a `@ts-expect-error` comment. The type check failed it with TS2578, "Unused '@ts-expect-error' directive", while the test runner passed the file. The type-level tests are therefore enforced by the type check, which runs earlier in CI, and not by the unit tests. The Vitest configuration has no type-checking option set.

Fourth, a record with a missing key failed with TS2739 and named the two missing template slugs.

### What this does not verify

Nothing here shows that copied components compile under a looser or different configuration, or under another TypeScript version. The cost of the flags was not measured: not the build time, not the number of lines that exist only to satisfy them. Only the metadata type was tested for the effect of removing its annotations, not the other optional properties in the code. The unused-directive behavior was reproduced once, in one configuration. The statements about the compiler options come from the TypeScript reference page listed below, and only the first part of that long page was read.

## Trade-offs and lessons learned

The optional-property rule is the one with the most visible cost. Every optional prop that can legitimately receive `undefined` needs `| undefined` written out, and the conventions page says so. The benefit is that the type can tell a missing prop from one set to `undefined`. A tempting conclusion is that the flag forces awkward code around third-party props, and a conditional spread in the dialog component looks like an example: it only passes a `container` when there is one. Replacing it with a direct prop type-checked without errors against the installed Radix types, so that spread is not required by the flag. The lesson is to test the compiler before attributing a pattern to it.

`noUncheckedIndexedAccess` pushes small defaults into destructuring, such as `name = ''` in the contrast test's token reader, and a guard after each array read. That is noise in a few places and a real missing-item bug caught in others, and this note did not count either.

The strict lint rules cost the occasional disabling comment. One in the metadata helper explains that a type parameter names the loader's data type at the call site, which the rule cannot see.

Typing the playground helper over the component's props means a control for a prop that does not exist fails to compile, but the helper has to erase the generics to store the result. It does that with casts and a comment saying the configuration was already checked. A boundary like that is where type safety ends and discipline begins.

The most useful lesson is about enforcement. A test that proves a line must not compile only works if the type checker reads the test file, and that is true here only because the project's configuration includes `src`. Anyone who moves tests out of that include, or runs only the unit tests, silently loses those assertions.

## References

- The TypeScript [TSConfig reference](https://www.typescriptlang.org/tsconfig/), opened while writing this note: it describes `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`, and its list of options enabled by `strict` includes neither.

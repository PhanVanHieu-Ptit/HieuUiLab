# Component conventions

Every entry in `src/components/ui/` and `src/components/blocks/` is written the same way, so a copied file reads like the rest of your project and the registry can document it automatically. This page describes the conventions the code actually follows. [Button](/components/button#code) is the reference: open its Source tab alongside this page. To add a component of your own, follow [Adding a component](/docs/component-conventions/adding-a-component).

## Files and exports {#files}

- **One flat file per entry**, at `src/components/ui/<slug>.tsx` for a component or `src/components/blocks/<slug>.tsx` for a block. Tests sit next to it as `<name>.test.tsx`; some related components share one test file, such as `inputs.test.tsx`.
- **Named exports only**, and no barrel `index.ts` files. A component whose props go beyond the native element's exports its props interface beside it, for example `ButtonProps`. One that takes only the native element's or a Radix part's props, such as `Kbd`, `Skeleton`, or the parts of `Table`, exports none, and its props are `ComponentProps<'kbd'>` and so on.
- **Compound components** are separate exported functions with a shared prefix: `Card`, `CardHeader`, `CardContent`; `Dialog`, `DialogContent`, `DialogTitle`. A part that needs its parent throws a clear error when used outside it, as the parts of `Field` do.
- **Radix primitives** come from the single `radix-ui` package. A simple primitive is re-exported (`Select` is `SelectPrimitive.Root`), and a part that needs styling is wrapped in a function.

## Props and refs {#props}

- Props extend the native element's: `ComponentProps<'button'>`, or `ComponentProps<typeof SomePrimitive.Part>` for a Radix part. In React 19, `ref` is an ordinary prop, so entries do not use `forwardRef`.
- **Variants** use `class-variance-authority`. The component's props extend `VariantProps<typeof variants>`, and the variants function is exported when callers need it (`buttonVariants`, `badgeVariants`). Button, Input, and Select's trigger share one `sm`, `md`, `lg` size scale.
- **`asChild`** renders the single child element in place of the component's own, merging props onto it with `Slot.Root` from `radix-ui`. Button, Card, and Breadcrumb links take it as a prop; `FieldControl` in Field uses the same `Slot` to merge ids and ARIA attributes onto its one child.
- **Safe defaults.** A button's `type` is `"button"` unless you set it, so it never submits a form by accident, and `loading` disables it and sets `aria-busy`. With `asChild` the child is not a button, so `loading` and `disabled` become `aria-busy`, `aria-disabled`, and `data-disabled` on it, and its click is cancelled.

## Styling {#styling}

- Classes are merged with `cn()` from `@/lib/cn`, with the caller's `className` last so it wins.
- Components use **semantic token utilities** (`bg-surface`, `text-muted-foreground`, `border-border`) and never raw palette colors such as `bg-blue-600`. They do not use `dark:` variants; the tokens change with the theme. [Design tokens](/docs/design-tokens) lists them.
- Focus and disabled looks come from the shared `focus-ring`, `focus-ring-inset`, and `disabled-state` utilities, so every control behaves alike.
- `data-slot` is not a library-wide convention. It appears only as a styling hook in Alert's title and in Field's description and error.

## Accessibility {#accessibility}

JSDoc comments on components and props state the ARIA behavior they provide, and each entry's metadata carries usage guidelines. Tests find elements by role and accessible name, and cover the keyboard. [Accessibility guidelines](/docs/accessibility) has the details.

## TypeScript and formatting {#typescript}

- The project compiles with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`, so an optional prop is written `x?: T | undefined` where `undefined` can be passed explicitly, and array reads handle a missing item. Type-only imports use `import type`.
- ESLint runs the type-aware strict rules, bans `any`, and treats every warning as an error.
- Prettier writes no semicolons, single quotes, and 100 columns, and sorts Tailwind classes, including inside `cva` and `cn`. Run `pnpm format` before committing.

## What the registry checks {#registry}

An entry's metadata is typed, and a validator rejects an entry whose install steps no longer match its source, whose documented parts the file does not export, or whose dependencies are missing or circular. [Adding a component](/docs/component-conventions/adding-a-component) lists everything it rejects, and [Component API reference](/docs/component-api) shows what each entry documents.

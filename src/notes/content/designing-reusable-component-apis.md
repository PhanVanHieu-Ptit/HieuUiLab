# Designing reusable React component APIs

## Context and problem

The components in this lab are meant to be copied into other projects. Each one is a single file that a reader pastes into their own source tree and then owns. That changes what an API is for. There is no package version to bump and no central place to fix a mistake once it has been copied, so the props a component accepts are a contract that has to hold up without maintenance.

The problem is to keep a small set of components flexible enough for real use, while keeping them accessible by default and keeping the number of props low. A button has to render as a link sometimes. An input has to work with and without a form library. A card needs a heading level that depends on the page around it. Each of these pushes toward more props, and each extra prop is something a copied component has to keep supporting.

## Constraints

Each component is one flat file with named exports and no barrel file, so a reader can copy it without copying a framework. Dependencies are kept small: the `radix-ui` package, `class-variance-authority`, the `cn` helper that wraps `clsx` and `tailwind-merge`, and an icon where one is needed. The project targets React 19.

The code compiles with `strict`, `noUncheckedIndexedAccess`, and `exactOptionalPropertyTypes`, so a prop's type has to say whether `undefined` is allowed. Accessibility behavior has to be the default, not something a caller remembers to add. And every component has hand-written API metadata that the registry turns into props tables. The registry validator checks that documented parts are real exports and that each prop has a type and a description. It does not compare a documented type with the TypeScript type in the source, so the documentation can say more than the code does.

## Approach and alternatives considered

Five decisions shape the API of the components discussed here, and each had an alternative.

1. **Extend the native element's props.** A component takes `ComponentProps<'button'>` and spreads the rest onto the element, so every attribute a caller already knows works. The alternative is a curated list of props, which is easier to document and harder to outgrow. The one place a native prop is removed is `Input`, where the native `size` attribute is replaced by the small, medium, and large scale shared with the other controls.
2. **Describe appearance with variants.** `class-variance-authority` turns `variant` and `size` into unions of known values with defaults, and the variants function is exported so a link can wear a button's styles, as the About and project pages do. The reasoning against boolean flags such as `primary` and `large` is that two flags can contradict each other, while one union cannot.
3. **Choose between a narrow `as` prop and `asChild`.** `CardTitle` takes `as`, limited to a few heading levels, because the only thing that changes is the tag. `Button` and `CardLink` take `asChild`, which merges props onto the single child, because the thing that changes is which component renders, for example a router link. `FieldControl` has no `asChild` prop and always merges onto its one child in the same way. A fully generic polymorphic `as` prop was not built.
4. **Use compound components when parts must agree.** A form field has a label, a control, a description, and an error whose ids must reference each other. `Field` owns the generated ids in a context, and its parts read them. A single component with a configuration object was the alternative; it was not built, and the reasoning is that it would make each part's markup harder to change.
5. **Treat `ref` as an ordinary prop.** In React 19 a function component receives `ref` as a prop, and no TypeScript file under `src/` uses `forwardRef`.

## Implementation example

The props of `Button` are the native button's props, the variant props derived from the `cva` call, and two additions of its own.

```tsx title="src/components/ui/button.tsx (the props)"
export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  /** Render the single child element instead of a `<button>`, merging props onto it. */
  asChild?: boolean
  /** Show a spinner, set `aria-busy`, and disable interaction. */
  loading?: boolean
}
```

Its body has two branches. In the first, `asChild` renders a `Slot.Root` and passes the class names and the remaining props to the child. In the second, the component renders its own `button` with a safe default `type`, the loading state, and the same spread.

```tsx title="src/components/ui/button.tsx (the two branches)"
const classes = cn(buttonVariants({ variant, size }), className)

if (asChild) {
  return (
    <Slot.Root className={classes} {...props}>
      {children}
    </Slot.Root>
  )
}

return (
  <button
    // Default to "button" so it never submits a surrounding form by accident.
    type={type ?? 'button'}
    className={classes}
    disabled={disabled === true || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
    {children}
  </button>
)
```

`Input` shows the one deliberate departure from the native props.

```tsx title="src/components/ui/input.tsx (replacing one native prop)"
export interface InputProps
  extends Omit<ComponentProps<'input'>, 'size'>, VariantProps<typeof inputVariants> {}
```

`CardTitle` shows the narrow form of polymorphism, where only the tag varies.

```tsx title="src/components/ui/card.tsx (a narrow as prop)"
type HeadingTag = 'h2' | 'h3' | 'h4' | 'p'

export interface CardTitleProps extends ComponentProps<'h3'> {
  /** Heading level that fits the surrounding document outline. */
  as?: HeadingTag
}

export function CardTitle({ as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Tag
      className={cn('flex items-center gap-2 leading-snug font-semibold tracking-tight', className)}
      {...props}
    />
  )
}
```

`Field` shares its state through a context. A part used outside a `Field` fails with a message that names the part, and `FieldControl` merges the generated id and the ARIA attributes onto its one child.

```tsx title="src/components/ui/field.tsx (context and the merged control)"
function useFieldContext(component: string): FieldContextValue {
  const context = use(FieldContext)
  if (!context) throw new Error(`<${component}> must be used inside <Field> or <FieldSet>.`)
  return context
}
// …
export function FieldControl({ children }: { children: ReactElement }) {
  const controlProps = useFieldControlProps()
  return <Slot.Root {...controlProps}>{children}</Slot.Root>
}
```

## Verification

The unit tests for these components find elements by role and accessible name. The `Button` tests cover the default `type`, an explicit `type`, variant and size classes, keyboard activation, the disabled and loading states, `asChild` rendering a link, and a ref reaching the underlying element. The `Card` and `Field` tests cover heading levels, the stretched link, and the wiring between a control and its description and error.

```bash title="Command: run the component API tests"
pnpm test src/components/ui/button.test.tsx src/components/ui/card.test.tsx src/components/ui/field.test.tsx src/components/ui/inputs.test.tsx
```

The `asChild` branch deserves a check of its own, because it is the one place where `Button` hands behavior to something else. A throwaway test rendered `Button` with `asChild`, `loading`, `disabled`, and `type="submit"`, once around a link and once around a `button` element. It passed, which means these props did not reach the child: neither child had `aria-busy`, a `disabled` attribute, a `type`, or a spinner, and a click on the `button` child still called the handler.

```tsx title="Hypothetical example: what asChild forwards (a throwaway check, not in the repository)"
render(
  <Button asChild loading disabled type="submit" onClick={onClick}>
    <button>Button child</button>
  </Button>,
)
const child = screen.getByRole('button', { name: 'Button child' })
await user.click(child)
expect(child).not.toHaveAttribute('aria-busy')
expect(child).not.toBeDisabled()
expect(onClick).toHaveBeenCalledTimes(1)
```

### What this does not verify

The suite has no test that `loading`, `disabled`, or `type` behave in the `asChild` branch, which is why the gap above went unnoticed. The throwaway check used a plain link and a plain button, not a router `Link`. Refs were tested only for the native button, not through `asChild`. Nothing compares the documented prop types with the real ones, and the other components were not audited for the same kind of gap. The claims about React and Radix come from the two pages listed below, read once, and were not tested here.

## Trade-offs and lessons learned

Passing every native prop through keeps the components familiar and makes the API surface very wide. It cannot be narrowed later without breaking the files people have already copied, and the one exception, `Input` replacing `size`, has to be explained in a comment.

`asChild` buys flexibility at a cost that is easy to miss. The component stops being the element, so anything it does by rendering its own element does not happen. For `Button` that is the loading state and the safe `type`. The registry metadata describes `loading` as showing a spinner, setting `aria-busy`, and disabling the button; the description of that prop does not mention `asChild`, and the guidelines repeat the claim. With `asChild` it is not true: the checks above show no spinner, no `aria-busy`, and a click that still goes through. This was found while writing this note, and the component has not been changed as part of it. The options are to forward the relevant attributes to the child, to refuse the combination in the types, or to say in the metadata that `loading` applies only to the native button.

The wider lesson is about documentation that is written by hand next to the code. A validator that checks that parts exist and props have descriptions cannot notice a sentence that stops being true in one mode. A test for each documented behavior in each mode that changes the rendered element would have caught this one.

A compound component such as `Field` costs more files and more concepts than a single component with a configuration object. In return each part keeps ordinary markup and ordinary props, and the context can enforce its own use with an error that names the part.

## References

- React's [React 19 announcement](https://react.dev/blog/2024/12/05/react-19), opened while writing this note: it says that `ref` can be accessed as a prop for function components, and that new function components will no longer need `forwardRef`.
- Radix's [composition guide](https://www.radix-ui.com/primitives/docs/guides/composition), opened while writing this note: it describes `asChild` as cloning the child and passing it the props it needs, and it says the child must spread props onto its DOM node and forward refs.

# React Hook Form and Zod in a component library

## Context and problem

A form is several concerns that are easy to tangle. There are rules for what a valid value is, a way to show the rule that failed next to the control it belongs to, a submit step that is pending for a while and then succeeds or fails, and the accessibility work of moving focus to the right place. Rules often end up in three places: the schema, the interface, which marks fields as required, and the code that handles a rejection from the server.

The problem for a library is to give those concerns a home each, so that the rules are written once, the components that display them stay reusable, and the types of the values a handler receives are the types after parsing, not before. The stack is React Hook Form for form state, Zod for the schema, and the resolver package that connects them.

## Constraints

The library is copy-and-own, so the form adapter should not force a validation library on whoever copies it. The project depends on `react-hook-form` 7, `zod` 4, and `@hookform/resolvers` 5, and compiles with strict settings, so generic types have to be right, not approximately right.

Controls are not only native inputs. Selects, checkboxes, and switches come from Radix, so a field has to be bindable through a value and a change handler. A failed submit has to be accessible: the first invalid control receives focus, an error is attached to its control, and the outcome of a submit is announced.

Nothing is sent to a server: the docs say so, and the submit handlers in the examples are mocks that return a result after a short delay. Server-side rejection is simulated, and nothing here says how a real backend would behave.

## Approach and alternatives considered

1. **The schema owns the rules and the interface only displays them.** The adapter's own comment says validation stays in the resolver. The alternative is per-field rules or the browser's built-in constraint validation, which spreads the rules across components.
2. **The adapter does not import Zod.** The `Form` entry imports only `react-hook-form`, and each form pairs it with a resolver. A wrapper that took a Zod schema directly would be shorter to use and would tie a copied file to one library and one major version.
3. **Bind every field with `Controller`.** `FormField` renders through `Controller`, which hands the control a value, a change handler, and a ref, so any component can be bound. The alternative, `register`, is simpler for native inputs and fits a Radix control less naturally. This is the reasoning behind the choice, not something the repository states, and `register` was not tried.
4. **Type the form with an input type and an output type.** A schema with transforms parses to a different type than the one the inputs hold. The form is declared with three type arguments, the input type, the context, and the output type, so the submit handler receives the parsed values.
5. **Report an expected failure as a value, not an exception.** A handler returns a result that is either a success or a failure with a message and optional per-field messages. A thrown error or rejected promise is treated as an unexpected failure with a generic message.
6. **Derive "required" from the schema.** Instead of restating which fields are required, the form parses a blank value once and marks every field the schema rejects.

## Implementation example

`FormField` takes the form's `control` as an explicit prop, so it does not need a provider around it. Its type arguments carry the input type, the field name, and the output type. It renders the control inside a `Field` and shows the schema's message for that value.

```tsx title="src/components/ui/form.tsx (binding one value to a field)"
export interface FormFieldProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
  TTransformedValues,
> {
  control: Control<TFieldValues, unknown, TTransformedValues>
  name: TName
// …
    <Controller
      control={control}
      name={name}
// …
            <FieldError>{fieldState.error?.message}</FieldError>
```

What a submit handler reports back is a union. Field names in a failure are checked against the form's own field paths, so a misspelled server field is a compile error.

```ts title="src/components/ui/form.tsx (what a handler reports back)"
export type SubmitResult<TFieldValues extends FieldValues> =
  | { ok: true; message?: string }
  | {
      ok: false
      message: string
      fieldErrors?: readonly { name: FieldPath<TFieldValues>; message: string }[]
    }
```

`useFormSubmit` turns a thrown error into the generic failure, and sets each server field error on its field with the type `server`, plus one error on the form itself.

```tsx title="src/components/ui/form.tsx (running the handler and reporting failures)"
try {
  result = await onSubmit(values)
} catch {
  result = { ok: false, message: failureMessage }
}
// …
for (const error of fieldErrors) {
  setError(error.name, { type: 'server', message: error.message })
}
setError('root.server', { type: 'server', message: result.message })
```

In the profile form, a schema field uses a transform, so the value the input holds and the value the handler receives are different types. The two types are exported next to the schema.

```ts title="src/components/blocks/profile-form.tsx (a schema whose output differs)"
  website: z
    .string()
    .trim()
    .refine((value) => value === '' || httpsUrl.safeParse(value).success, {
      message: 'Enter a full address starting with https://, or leave it empty.',
    })
    .transform((value) => (value === '' ? null : value)),
// …
/** What the inputs hold while editing. */
export type ProfileFormInput = z.input<typeof profileSchema>
/** What a valid submission delivers: trimmed, with empty optional fields as `null`. */
export type ProfileFormValues = z.output<typeof profileSchema>
```

The form passes all three type arguments to `useForm`. Errors appear after the first submit and then update as the value changes.

```tsx title="src/components/blocks/profile-form.tsx (the form)"
const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
  resolver: zodResolver(profileSchema),
  defaultValues: { ...blankProfile, ...defaultValues },
  mode: 'onSubmit',
  reValidateMode: 'onChange',
})
```

The required markers come from the schema, so they cannot disagree with the rules.

```ts title="src/components/blocks/profile-form.tsx (required fields from the schema)"
// A field is marked required when the schema rejects it left blank, so the
// markers can never disagree with the rules.
const requiredFields = new Set(
  profileSchema.safeParse(blankProfile).error?.issues.map((issue) => issue.path[0]) ?? [],
)
```

## Verification

The adapter has four unit tests, and the profile form and the search form each have end-to-end coverage in a real browser. The unit tests check the schema errors with focus on the first invalid field, a submit that delivers parsed values (a name typed with surrounding spaces arrives trimmed), a server field error that is shown, announced, and focused and then replaced by the schema's verdict once the value is edited, and a rejected handler that becomes a generic failure while the typed values are kept.

```bash title="Command: run the form unit tests"
pnpm test src/components/ui/form.test.tsx src/components/blocks/profile-form.test.tsx
```

```bash title="Command: run the forms end-to-end tests"
pnpm test:e2e e2e/forms.spec.ts
```

The claim that the three type arguments are needed, not just conventional, was checked with a throwaway file that was type-checked and then deleted. It declared the profile form with only the input type and passed it the resolver. That failed to compile, and the same call with all three type arguments compiled.

```ts title="Hypothetical example: declaring the form with one type argument (a throwaway check, not in the repository)"
export function withoutOutputType() {
  return useForm<ProfileFormInput>({ resolver: zodResolver(profileSchema) })
}
```

```text title="Hypothetical example: the decisive lines of the compiler's message (abridged, reproduced once, not in the repository)"
TS2719: Type 'Resolver<...>' is not assignable to type 'Resolver<...>'. Two different types with this name exist, but they are unrelated.
  Types of property 'website' are incompatible.
    Type 'string | null' is not assignable to type 'string'.
```

### What this does not verify

The adapter was tested with one resolver only, so its independence from Zod is a property of its imports and not something demonstrated with a second library. Array fields, nested field names, and asynchronous validation were not exercised. Screen reader behavior was not tested: the tests check for the alert role and the focus, not for what is spoken. No example talks to a server, so the handling of real network failures is untested beyond a rejected promise. The React Hook Form documentation site could not be opened while writing this note, so the statements about its generics come from the resolver package's README and from the compiler itself.

## Trade-offs and lessons learned

The three type arguments are the price of parsing. The resolver package's README says that passing a single type argument pins the input and output to the same type and conflicts with the Zod resolver, which matches the failure above. Every form in the blocks that has a schema repeats the three-argument form, and the one form without a schema, the notification preferences, uses a single argument correctly. A convention that a compiler enforces is better than one that a reviewer has to remember, and this one is enforced only where the types actually differ.

`FormField` has three type parameters, which makes its signature hard to read even though call sites infer them. The render function has to wrap its control in `FieldControl` and pass the field's ref, and the interface comment says so. Forgetting the ref would stop focus from reaching that control on an invalid submit. That follows from how the ref is used and was not tested.

Deriving required markers by parsing a blank value is simple and cannot drift from the rules. It also equates required with rejected when blank, so a rule such as "required only when another field is set" would not be reflected.

Returning failures as values makes the common paths easy to test and type-check, and leaves thrown errors for the unexpected. The cost is that a handler must remember to return a result in every branch, and the generic failure message hides the reason for a thrown error.

The lesson is about where the seams go. The schema decides, the adapter displays, and the hook tracks the lifecycle. Each can change without the others, which is the main reason the files stay small enough to copy.

## References

- The Zod documentation on [inferring types](https://zod.dev/basics), opened while writing this note: it says that the input and output types of a schema can diverge, with `.transform()` as the main case, and that `z.input` and `z.output` extract them separately.
- The README of [@hookform/resolvers](https://github.com/react-hook-form/resolvers), opened while writing this note: it warns that passing a single type argument to `useForm` conflicts with `zodResolver`, and shows the three-argument form with `z.input` and `z.output`.

# Form integration

Forms in this lab combine four pieces: a Zod schema that holds every rule, React Hook Form to run it, a thin adapter that binds each value to a labeled field and tracks the submission, and a message that reports the outcome. This page explains how the pieces fit together. Each entry's own page has its full API and more examples.

## The pieces {#pieces}

- **A Zod schema** holds every validation rule and supplies the error messages. The interface restates none of them.
- **`useForm` with `zodResolver`** runs the schema. `react-hook-form`, `zod`, and `@hookform/resolvers` are all dependencies of this project. The [Form](/components/form) entry itself imports only `react-hook-form`; it does not validate, so you pair it with a resolver.
- **[Field](/components/field)** wires any control to its label, helper text, and error with generated ids, `aria-describedby`, and `aria-invalid`. It works with or without a form library.
- **`FormField`**, from the [Form](/components/form) entry, binds one React Hook Form value to a `Field` through `Controller` and shows the schema's error for that value.
- **`useFormSubmit`**, from the same entry, runs your submit handler once the schema accepts the values and tracks `pending`, success, and server errors.
- **[Form feedback](/components/form-feedback)** shows the outcome as an announced message that takes focus when it appears.

## A complete form {#example}

This is the Form entry's example. The Code tab shows the real source, which the page extracts from the demo file, so it is the code that is running.

::registry-example{slug="form" example="invite"}

## What happens on submit {#submit}

`useFormSubmit` returns `{ submit, pending, feedback, clearFeedback }`. Pass `submit` to the form's `onSubmit`.

1. If the schema rejects the values, each error appears under its field through `FormField`. React Hook Form focuses the first invalid field. `pending` stays `false`, so the fields are still enabled for that focus to land.
2. If the schema accepts them, `pending` becomes `true`, earlier feedback is cleared, and your handler runs with the parsed values (the schema's output type).
3. If the handler returns `{ ok: true }`, success feedback shows its `message`, or `successMessage` (default "Saved.").
4. If it returns `{ ok: false, message, fieldErrors }`, each field error is set on its field with the type `server`, and the first of them is focused once the form is enabled again. A server error is replaced by the schema's own errors as soon as the value changes. With no field errors, the failure feedback takes focus instead.
5. If the handler throws or rejects, the failure feedback shows `failureMessage` (default "Something went wrong, and nothing was saved. Try again.").

Give `FormFeedback` a new `key` per submission, as the example does with `feedback.id`, so a repeated result is focused and announced again.

## Conventions {#conventions}

The Form entry's Usage section lists the conventions its example follows: typing the form as `useForm<z.input<S>, unknown, z.output<S>>` so the handler receives parsed values, deriving required markers from the schema, disabling the fields with `<fieldset disabled={pending}>`, and returning server problems as a `SubmitResult`. A custom control goes inside `FieldControl`, which merges the ids and ARIA attributes onto its one child, and receives `field.ref` so focus can reach it.

## API {#api}

### FormField {#api-form-field}

::registry-api{slug="form" part="FormField"}

### useFormSubmit {#api-use-form-submit}

::registry-api{slug="form" part="useFormSubmit"}

### FormFeedback {#api-form-feedback}

::registry-api{slug="form-feedback"}

## Forms in the blocks {#blocks}

Six blocks use this stack, and each exports its Zod schema and input and output types, so tests and other code can reuse them: [Profile form](/blocks/profile-form), [Search and filter form](/blocks/search-filter-form), [Sign-in page](/blocks/sign-in-page), [Multi-step onboarding](/blocks/multi-step-onboarding), [User profile settings](/blocks/user-profile-settings), and [CRUD management page](/blocks/crud-management-page). They are examples with mock data: nothing is sent to a server, and the sign-in page does no authentication.

## Testing a form {#testing}

`src/components/ui/form.test.tsx` covers schema errors with focus on the first invalid field, a submit with parsed values, server field errors with focus on the rejected field, and a rejected handler. `e2e/forms.spec.ts` drives the profile form (including saving from the keyboard) and the search and filter form in a real browser. [Testing strategy](/docs/testing) explains how both kinds of test run.

import type { ImplementedEntry } from '../types'

export const formEntry: ImplementedEntry = {
  id: 'form',
  slug: 'form',
  name: 'Form (React Hook Form)',
  description:
    'A thin React Hook Form adapter: FormField binds a value to a Field, and useFormSubmit tracks pending, success, and server errors.',
  kind: 'component',
  category: 'inputs',
  tags: ['async', 'composition', 'form', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/ui/form.tsx',
    packages: ['react-hook-form'],
    registryDependencies: ['field'],
    requirements: [],
    notes: [
      'Pair it with a schema resolver such as zodResolver from @hookform/resolvers; the adapter itself does not validate.',
    ],
  },
  guidelines: [
    'Type the form as `useForm<z.input<S>, unknown, z.output<S>>` so the submit handler receives parsed values.',
    'Derive required markers from the schema, for example by parsing blank values once, instead of restating rules in the UI.',
    'Disable the fields with `<fieldset disabled={pending}>`, using the hook’s `pending`. It turns true only after validation passes, so focusing the first invalid field still works.',
    'Return server problems as a `SubmitResult`: field errors are set on their fields and cleared when the value changes.',
  ],
  api: {
    parts: [
      {
        name: 'FormField',
        props: [
          {
            name: 'control / name',
            type: 'Control<T> / FieldPath<T>',
            required: true,
            description: 'The form and the value this field edits.',
          },
          {
            name: 'label',
            type: 'ReactNode',
            required: true,
            description: 'Visible label.',
          },
          {
            name: 'description',
            type: 'ReactNode',
            description: 'Helper text linked to the control.',
          },
          {
            name: 'required / disabled',
            type: 'boolean',
            default: 'false',
            description: 'Passed to Field.',
          },
          {
            name: 'orientation',
            type: "'vertical' | 'horizontal'",
            default: "'vertical'",
            description: 'Horizontal for Checkbox and Switch.',
          },
          {
            name: 'deps',
            type: 'FieldPath<T> | FieldPath<T>[]',
            description: 'Fields to validate again when this one changes.',
          },
          {
            name: 'render',
            type: '({ field, fieldState }) => ReactElement',
            required: true,
            description: 'Renders the control inside FieldControl; pass field.ref to it.',
          },
          { name: 'className', type: 'string', description: 'Classes for the Field.' },
        ],
      },
      {
        name: 'useFormSubmit',
        description: 'Returns { submit, pending, feedback, clearFeedback }.',
        props: [
          {
            name: 'form',
            type: 'UseFormReturn<T, C, O>',
            required: true,
            description: 'The useForm result.',
          },
          {
            name: 'onSubmit',
            type: '(values: O) => Promise<SubmitResult<T>>',
            required: true,
            description: 'Runs with valid values. A rejection becomes the failure message.',
          },
          {
            name: 'options',
            type: '{ successMessage?: string; failureMessage?: string }',
            description: 'Fallback messages.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}

import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Field,
  FieldControl,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { FormField, useFormSubmit, type SubmitResult } from '@/components/ui/form'
import { FormFeedback } from '@/components/ui/form-feedback'
import { Input } from '@/components/ui/input'
import { SearchInput } from '@/components/ui/search-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

const queryMax = 100

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const

const statusLabels: Record<(typeof orderStatuses)[number], string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const sortOrders = ['updated-desc', 'updated-asc', 'total-desc', 'total-asc'] as const

const sortLabels: Record<(typeof sortOrders)[number], string> = {
  'updated-desc': 'Recently updated',
  'updated-asc': 'Least recently updated',
  'total-desc': 'Highest total',
  'total-asc': 'Lowest total',
}

const isoDate = z.iso.date()

/** An optional date input value: empty, or a complete `YYYY-MM-DD` date. */
const optionalDate = z
  .string()
  .refine((value) => value === '' || isoDate.safeParse(value).success, {
    message: 'Enter a complete date, or leave it empty.',
  })

/** Every rule the search form enforces. The UI only displays this schema's results. */
export const searchFilterSchema = z
  .object({
    query: z
      .string()
      .trim()
      .max(queryMax, `Shorten the search to ${String(queryMax)} characters or fewer.`),
    statuses: z.array(z.enum(orderStatuses)).min(1, 'Choose at least one status.'),
    sort: z.enum(sortOrders, 'Choose a sort order from the list.'),
    updatedFrom: optionalDate,
    updatedTo: optionalDate,
    includeArchived: z.boolean(),
  })
  .superRefine((values, ctx) => {
    // Compare only two complete dates; a malformed one already has its own error.
    const bothDates =
      isoDate.safeParse(values.updatedFrom).success && isoDate.safeParse(values.updatedTo).success
    if (bothDates && values.updatedTo < values.updatedFrom) {
      ctx.addIssue({
        code: 'custom',
        path: ['updatedTo'],
        message: 'The end date must be on or after the start date.',
      })
    }
  })

export type SearchFilterInput = z.input<typeof searchFilterSchema>
/** What a valid search delivers: the query trimmed, dates as `YYYY-MM-DD` or `''`. */
export type SearchFilterValues = z.output<typeof searchFilterSchema>

const defaultFilters: SearchFilterInput = {
  query: '',
  statuses: ['pending', 'processing', 'shipped'],
  sort: 'updated-desc',
  updatedFrom: '',
  updatedTo: '',
  includeArchived: false,
}

// A field is marked required when the schema rejects it left blank, so the
// markers can never disagree with the rules.
const requiredFields = new Set(
  searchFilterSchema
    .safeParse({ ...defaultFilters, statuses: [] })
    .error?.issues.map((issue) => issue.path[0]) ?? [],
)

export interface SearchFilterFormProps {
  /**
   * Runs the search and reports the outcome; return a message such as "12
   * orders match". The results themselves belong to the parent, which renders them.
   */
  onSubmit: (values: SearchFilterValues) => Promise<SubmitResult<SearchFilterInput>>
  /** Called after Reset restores the default filters. */
  onReset?: () => void
  defaultValues?: Partial<SearchFilterInput>
  disabled?: boolean
}

/**
 * Search criteria for an order list on React Hook Form and Zod: a query,
 * a status group that needs at least one choice, a sort order, a date range
 * whose end cannot precede its start, and an archive toggle.
 */
export function SearchFilterForm({
  onSubmit,
  onReset,
  defaultValues,
  disabled = false,
}: SearchFilterFormProps) {
  const initialValues: SearchFilterInput = { ...defaultFilters, ...defaultValues }
  const form = useForm<SearchFilterInput, unknown, SearchFilterValues>({
    resolver: zodResolver(searchFilterSchema),
    defaultValues: initialValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { control } = form
  const { submit, pending, feedback, clearFeedback } = useFormSubmit(form, onSubmit, {
    successMessage: 'Search complete.',
    failureMessage: 'The search could not be completed. Try again.',
  })

  function reset() {
    form.reset(initialValues)
    clearFeedback()
    onReset?.()
  }

  return (
    <form
      role="search"
      noValidate
      onSubmit={submit}
      aria-label="Filter orders"
      className="grid w-full gap-6"
    >
      <fieldset disabled={disabled || pending} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <FormField
          control={control}
          name="query"
          label="Search orders"
          description="Order number or customer name."
          className="sm:col-span-2"
          render={({ field }) => (
            <FieldControl>
              <SearchInput
                autoComplete="off"
                {...field}
                onClear={() => {
                  field.onChange('')
                }}
              />
            </FieldControl>
          )}
        />
        <Controller
          control={control}
          name="statuses"
          render={({ field, fieldState }) => (
            <FieldSet
              invalid={fieldState.invalid}
              required={requiredFields.has('statuses')}
              className="sm:col-span-2"
            >
              <FieldLegend>Status</FieldLegend>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {orderStatuses.map((status, index) => (
                  <Field key={status} orientation="horizontal">
                    <FieldControl>
                      <Checkbox
                        ref={index === 0 ? field.ref : undefined}
                        name={field.name}
                        value={status}
                        checked={field.value.includes(status)}
                        onCheckedChange={(checked) => {
                          field.onChange(
                            checked === true
                              ? orderStatuses.filter(
                                  (option) => option === status || field.value.includes(option),
                                )
                              : field.value.filter((option) => option !== status),
                          )
                        }}
                        onBlur={field.onBlur}
                      />
                    </FieldControl>
                    <FieldLabel>{statusLabels[status]}</FieldLabel>
                  </Field>
                ))}
              </div>
              <FieldError>{fieldState.error?.message}</FieldError>
            </FieldSet>
          )}
        />
        <FormField
          control={control}
          name="updatedFrom"
          label="Updated from"
          deps="updatedTo"
          render={({ field }) => (
            <FieldControl>
              <Input type="date" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="updatedTo"
          label="Updated to"
          render={({ field }) => (
            <FieldControl>
              <Input type="date" {...field} />
            </FieldControl>
          )}
        />
        <FormField
          control={control}
          name="sort"
          label="Sort by"
          render={({ field }) => (
            <Select name={field.name} value={field.value} onValueChange={field.onChange}>
              <FieldControl>
                <SelectTrigger ref={field.ref} onBlur={field.onBlur}>
                  <SelectValue />
                </SelectTrigger>
              </FieldControl>
              <SelectContent>
                {sortOrders.map((order) => (
                  <SelectItem key={order} value={order}>
                    {sortLabels[order]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FormField
          control={control}
          name="includeArchived"
          label="Include archived orders"
          orientation="horizontal"
          className="self-end pb-2"
          render={({ field }) => (
            <FieldControl>
              <Switch
                ref={field.ref}
                name={field.name}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
              />
            </FieldControl>
          )}
        />
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button type="button" variant="outline" onClick={reset}>
            Reset filters
          </Button>
          <Button type="submit" loading={pending}>
            {pending ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </fieldset>
      {feedback ? (
        <FormFeedback
          key={feedback.id}
          status={feedback.status}
          title={feedback.status === 'success' ? feedback.message : 'Search failed'}
          focusOnMount={feedback.focus}
        >
          {feedback.status === 'error' ? feedback.message : null}
        </FormFeedback>
      ) : null}
    </form>
  )
}

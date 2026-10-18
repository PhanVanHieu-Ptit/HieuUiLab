# DataTable usage

[Data table](/blocks/data-table) is a generic, semantic table for typed rows. It sorts columns, paginates and selects rows in the browser, and has explicit loading, empty, and error states. This page explains how to drive it and what it does not do. The props are generated from the entry's metadata, so they match the source.

## A first table {#first}

This example sorts by finish time, newest first, and pages five rows at a time. The Code tab shows the real source.

::registry-example{slug="data-table" example="sorting-and-pagination"}

## Describe the rows and columns {#columns}

`DataTable<T>` is generic over the row type. Give it a `label` (its caption and the name of its scroll region), the `columns`, a `state`, and a `getRowId` that returns a stable id for each row.

- **`state`** is one of `{ status: 'loading' }`, `{ status: 'error', message? }`, or `{ status: 'ready', items }`. A ready state with no items renders the empty state.
- **`columns`** are `DataTableColumn<T>` objects. Define the array outside the component or memoize it: sorting is memoized on each column's `sortValue` function, so a new function on every render re-sorts on every render.
- Mark the column that names each row with `rowHeader`, so its cells are row headers for screen readers.

### DataTable {#api-data-table}

::registry-api{slug="data-table" part="DataTable"}

### DataTableColumn {#api-column}

::registry-api{slug="data-table" part="DataTableColumn<T>"}

## Sorting {#sorting}

A column is sortable when it has a `sortValue`, which returns a string, number, `Date`, `null`, or `undefined`. Activating a header cycles ascending, descending, then the original order. Empty values (`null`, `undefined`, `NaN`, invalid dates) sort last in both directions, and strings compare with numeric collation, so "item 2" comes before "item 10".

Sorting is uncontrolled by default; set the first order with `defaultSort`. To own the state, pass `sort` and `onSortChange`; pass `null` for the original order. The sorted header carries `aria-sort`.

## Pagination {#pagination}

Pages hold 25 rows unless you set `defaultPageSize`, and a page never holds more than 100. Pass `pageSizeOptions` to show a rows-per-page select. To control paging, pass `page` and `onPageChange` (pages start at 1), and `pageSize` and `onPageSizeChange` for the size. An out-of-range page is clamped to the nearest valid one, so a shrinking list never shows a blank page.

`sortRows` and `paginateRows` are exported pure functions, for code that needs the same ordering and slicing outside the component.

::registry-api{slug="data-table" part="sortRows / paginateRows"}

## Selection {#selection}

Pass `selection` to add a checkbox column. It takes the selected ids, a change handler, and a `rowLabel` function that names each row's checkbox for assistive technology. Selection is controlled and survives paging. The header checkbox selects or clears the rows on the current page. When the rows change, drop ids that are no longer in the data yourself.

::registry-example{slug="data-table" example="selection"}

## Loading, empty, and error states {#states}

The headers stay in place in every state. While loading, the table shows `skeletonRows` placeholder rows (five by default) and announces the loading. Override the empty state with `empty` (a title, description, and optional action), for example to say that no rows match the filters. Pass `onRetry` to show a retry button in the error state.

::registry-example{slug="data-table" example="states"}

## Filtering and larger data {#data}

Filtering is your job: filter the rows before passing them in (see [Data toolbar](/blocks/data-toolbar) for the controls), and go back to page 1 when the filters change. The [CRUD management page](/blocks/crud-management-page) and [Orders dashboard](/blocks/orders-dashboard) blocks show a filtered table inside a whole screen, with mock data.

Sorting and pagination run in the browser on the rows you pass in. They are intended for up to about 10,000 rows, and the tests check correctness at that size, not speed. Only the current page is rendered. There is no server-side mode, virtualization, multi-column sort, or column resizing. For larger or remote data, sort and page on the server and pass one page of rows with a single page size.

## Accessibility {#accessibility}

The table keeps native table semantics, so screen readers keep their table navigation; it is not an ARIA grid. Sort buttons, checkboxes, row actions, and pagination are native elements in the Tab order. When the table is wider than its container, its scroll region becomes focusable so the arrow keys can scroll it. Put row actions in a cell as buttons or links rather than making a whole row clickable, and use `hideBelow` only for columns whose data is available elsewhere, such as a detail view. [Accessibility guidelines](/docs/accessibility) covers the wider rules.

## Try it and test it {#try}

The [Playground](/playground?example=data-table) renders a data table with controls for its state, row count, page size, caption, selection, and sorting, and generates the code for the configuration you choose. The unit tests are in `src/components/blocks/data-table.test.tsx`, including 10,000-row checks of `sortRows` and `paginateRows`; `e2e/data-display.spec.ts` sorts, pages, and selects with the keyboard in a real browser.

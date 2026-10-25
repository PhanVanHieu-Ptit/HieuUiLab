import type { ImplementedEntry } from '../types'

export const crudManagementPageEntry: ImplementedEntry = {
  id: 'crud-management-page',
  slug: 'crud-management-page',
  name: 'CRUD management page',
  description:
    'A list page for one kind of record: search, filters, a sortable paged table, and add, edit, and delete with validation and confirmation.',
  kind: 'block',
  category: 'pages',
  tags: ['async', 'composition', 'form', 'responsive', 'sorting', 'validation'],
  status: 'experimental',
  installation: {
    targetPath: 'components/blocks/crud-management-page.tsx',
    packages: ['lucide-react', 'react-hook-form', 'zod', '@hookform/resolvers'],
    registryDependencies: [
      'confirm-action',
      'data-table',
      'data-toolbar',
      'button',
      'dialog',
      'field',
      'form',
      'form-feedback',
      'input',
      'select',
      'status-badge',
    ],
    requirements: ['cn-helper', 'design-tokens'],
    notes: [
      'The page keeps no records: pass them in state and change them in onCreate, onUpdate, and onDelete. Search, filters, and paging run in memory; for large or server-side data, filter in your query and pass the page you want.',
      'The example record is a team member. To manage something else, edit ManagedMember, memberSchema, the columns, and the form fields together: they are the only parts that know the shape.',
    ],
  },
  guidelines: [
    'It builds on Data toolbar and Data table, so their behaviour applies: labelled controls, a polite result count, sortable headers, and a table that scrolls inside its own region instead of widening the page.',
    'The page owns only view state: search text, filters, the current page, and which dialog is open. Changing a search or a filter returns to page 1.',
    'Two different empty states: “No members yet” (with an Add action) when there is nothing, and “No members match” (with Clear filters) when the filters hide everything.',
    'Add and Edit share one dialog and one form on React Hook Form and Zod. Errors appear after the first submit; a server error for a field (such as a taken email) is shown on that field and the dialog stays open.',
    'Delete always asks first. A failure is shown inside the confirmation so the user can retry. After a delete the row and its button are gone, so focus moves to the page heading instead of being lost.',
    'Changes are announced from a status region (“Added…”, “Updated…”, “Deleted…”). The role column hides below the sm breakpoint and joined date below lg; the role then appears under the name, so nothing disappears.',
    'The dialog opens over the whole window. Pass dialogContainer to keep it inside a container, for example in a framed preview.',
  ],
  api: {
    parts: [
      {
        name: 'CrudManagementPage',
        props: [
          {
            name: 'state',
            type: 'DataTableState<ManagedMember>',
            required: true,
            description:
              'Loading, error, or the ready members. A ready state with no members is the “no members yet” state.',
          },
          {
            name: 'onCreate',
            type: '(values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>',
            required: true,
            description: 'Creates a member. Return field errors the server found.',
          },
          {
            name: 'onUpdate',
            type: '(id: string, values: MemberFormValues) => Promise<SubmitResult<MemberFormInput>>',
            required: true,
            description: 'Updates the member with this id. Same contract as onCreate.',
          },
          {
            name: 'onDelete',
            type: '(member: ManagedMember) => void | Promise<void>',
            required: true,
            description:
              'Deletes a member after the user confirms. A rejection is shown inside the confirmation.',
          },
          {
            name: 'onRetry',
            type: '() => void',
            description: 'Shows a retry button in the error state.',
          },
          {
            name: 'title',
            type: 'string',
            default: "'Team members'",
            description: 'Heading of the page; also names the table.',
          },
          {
            name: 'description',
            type: 'string',
            default: "'Invite people, change their role, or remove their access.'",
            description: 'Text under the heading.',
          },
          { name: 'pageSize', type: 'number', default: '5', description: 'Rows per page.' },
          {
            name: 'dialogContainer',
            type: 'HTMLElement | null',
            description: 'Portal the add/edit dialog into this element instead of the body.',
          },
          { name: 'className', type: 'string', description: 'Classes for the outer section.' },
        ],
      },
      {
        name: 'ManagedMember',
        description: 'The example record.',
        props: [
          { name: 'id', type: 'string', required: true, description: 'Stable unique id.' },
          { name: 'name', type: 'string', required: true, description: 'Full name.' },
          { name: 'email', type: 'string', required: true, description: 'Email address.' },
          {
            name: 'role',
            type: "'admin' | 'editor' | 'viewer'",
            required: true,
            description: 'Access level.',
          },
          {
            name: 'status',
            type: "'active' | 'invited' | 'suspended'",
            required: true,
            description: 'Account state.',
          },
          {
            name: 'joinedAt',
            type: 'string',
            required: true,
            description: 'ISO 8601 timestamp.',
          },
        ],
      },
      {
        name: 'memberSchema',
        description: 'The Zod schema behind the add/edit form; exported for server-side reuse.',
        props: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: '2–60 characters, trimmed.',
          },
          {
            name: 'email',
            type: 'string',
            required: true,
            description: 'Trimmed; must be an email address.',
          },
          {
            name: 'role',
            type: 'string',
            required: true,
            description: 'One of admin, editor, or viewer.',
          },
        ],
      },
      {
        name: 'MemberFormInput / MemberFormValues',
        description: 'What the form inputs hold, and what a valid submission delivers.',
        props: [
          {
            name: 'MemberFormInput',
            type: 'z.input<typeof memberSchema>',
            description: 'Values as typed; the role is a string.',
          },
          {
            name: 'MemberFormValues',
            type: 'z.output<typeof memberSchema>',
            description: 'Values passed to onCreate and onUpdate.',
          },
        ],
      },
      {
        name: 'filterMembers',
        description: 'The pure filter the page uses; exported for tests and server reuse.',
        props: [
          {
            name: 'members',
            type: 'readonly ManagedMember[]',
            required: true,
            description: 'Members to filter.',
          },
          {
            name: 'filters',
            type: "{ query: string; role: MemberRole | 'all'; status: MemberStatus | 'all' }",
            required: true,
            description:
              'Every filter must match. The query ignores case and accents and matches name or email.',
          },
        ],
      },
    ],
  },
  content: () => import('./content'),
}

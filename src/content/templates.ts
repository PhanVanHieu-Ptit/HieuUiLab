import type { RegistryTag } from '@/registry/taxonomy'
import type { ImplementedStatus } from '@/registry/types'

/**
 * The example apps. Light on purpose: navigation, search, and the landing page read this file, so
 * it holds descriptions and file paths only. The components live in `src/templates/` and load on
 * demand through `template-modules.ts`.
 */
export const templateSlugs = [
  'admin-dashboard',
  'operations-monitoring',
  'data-management-workspace',
] as const

export type TemplateSlug = (typeof templateSlugs)[number]

/** One screen of an example app: what it shows, and which registry blocks it is built from. */
export interface TemplateView {
  /** Matches the label of the sidebar button the template renders for it. */
  label: string
  summary: string
  /** Registry block slugs the view uses. A test checks them against what the source imports. */
  blocks: readonly string[]
}

export interface Template {
  slug: TemplateSlug
  title: string
  summary: string
  /** The imagined app, stating that its data is invented. */
  scenario: string
  status: ImplementedStatus
  tags: readonly RegistryTag[]
  views: readonly [TemplateView, ...TemplateView[]]
  /** How the views share state and data. */
  composition: readonly string[]
  decisions: readonly { title: string; rationale: string }[]
  limitations: readonly string[]
  /** Repository-relative source files. The first is the template component itself. */
  files: readonly [string, ...string[]]
  mockData: readonly { label: string; path: string }[]
}

export const templates: readonly Template[] = [
  {
    slug: 'admin-dashboard',
    title: 'Admin dashboard',
    summary:
      'A workspace admin app: an overview with a range switch, a notification inbox with an unread badge, and account settings, built from three page blocks.',
    scenario:
      'A made-up workspace admin. Every figure, name, and message is example data held in memory; nothing is fetched, saved, or sent.',
    status: 'experimental',
    tags: ['dashboard', 'charts', 'form', 'responsive'],
    views: [
      {
        label: 'Overview',
        summary:
          'Usage metrics, a trend chart, highlights, and recent activity for a chosen range.',
        blocks: ['dashboard-overview'],
      },
      {
        label: 'Notifications',
        summary: 'An inbox with All and Unread tabs, a type filter, and mark as read.',
        blocks: ['notification-center'],
      },
      {
        label: 'Settings',
        summary: 'Profile, notification preferences, and password, each with its own validation.',
        blocks: ['user-profile-settings'],
      },
    ],
    composition: [
      'The sidebar, the mock-state picker, and the three views make up the template. Everything inside a view is an existing block, used only through its public props.',
      'The range chosen on Overview and the list of notifications are held in the template, not in the blocks. They survive moving between views, and the sidebar badge counts unread notifications from the same list.',
      'One mock-state picker sets the loading, error, and loaded state of every view, so each block’s non-happy path can be seen inside the app that would use it.',
    ],
    decisions: [
      {
        title: 'State lives in the template',
        rationale:
          'The blocks are controlled and hold no data of their own. Keeping the range and the notifications in the template is what lets the badge and the range persist, and it is the same wiring an app with a real data layer would have.',
      },
      {
        title: 'Views are state, not routes',
        rationale:
          'The template imports no router, so it can be copied into any app. A real app would map each view to a route and pass the active one in.',
      },
      {
        title: 'The shell reflows with its container',
        rationale:
          'The views sit beside the content when the frame is wide and above it when narrow, using container queries. The preview width switcher therefore changes the layout the way a narrow window would.',
      },
    ],
    limitations: [
      'Nothing is persisted or fetched. Reloading resets everything, and every handler is a mock that waits briefly and succeeds.',
      'Unsaved changes in Settings are lost when you move to another view, because a view unmounts when another is chosen.',
      'There is no sign-in, permission model, or routing: the sidebar is a list of buttons, not links.',
      'Select menus render on the page rather than inside the preview frame, so they do not follow the preview theme.',
    ],
    files: [
      'src/templates/admin-dashboard/template.tsx',
      'src/templates/shared/template-shell.tsx',
    ],
    mockData: [
      { label: 'Dashboard overview', path: 'src/registry/dashboard-overview/mock-data.ts' },
      { label: 'Notification center', path: 'src/registry/notification-center/mock-data.ts' },
      { label: 'User profile settings', path: 'src/registry/user-profile-settings/mock-data.ts' },
    ],
  },
  {
    slug: 'operations-monitoring',
    title: 'Operations monitoring',
    summary:
      'An operations console: a service status board, an alert inbox, and a searchable incident log, all read from one list of services and incidents.',
    scenario:
      'A made-up operations console. The services, readings, and incidents are invented, and nothing is being monitored.',
    status: 'experimental',
    tags: ['dashboard', 'status', 'charts', 'responsive'],
    views: [
      {
        label: 'Service status',
        summary: 'Health of each service, latency and uptime for a range, and the incidents.',
        blocks: ['monitoring-dashboard'],
      },
      {
        label: 'Alerts',
        summary: 'Incidents as an inbox: open ones unread, resolved ones read.',
        blocks: ['notification-center'],
      },
      {
        label: 'Incident log',
        summary:
          'When each incident opened and resolved, with search, filters, saved views, and sort.',
        blocks: ['search-filter-toolbar', 'activity-list', 'empty-state', 'error-state'],
      },
    ],
    composition: [
      'The alert inbox and the incident log are derived from the same services and incidents the status board shows, so the three views cannot disagree.',
      'The refresh count and the read state live in the template. Refreshing the board moves the “checked at” time the inbox measures from, and marking an alert read updates the sidebar badge.',
      'The log is a search and filter toolbar over an activity list. Its empty, loading, and error states are the blocks’ own, and the picker switches them on.',
    ],
    decisions: [
      {
        title: 'One source of truth for incidents',
        rationale:
          'Mapping incidents to notifications and log entries, instead of writing separate data for each view, keeps the views consistent and shows how little glue the blocks need.',
      },
      {
        title: 'An incident under investigation takes the “assignment” slot',
        rationale:
          'The inbox has a fixed set of notification types. The one that needs a person is mapped to “assignment” and relabelled, instead of changing the block.',
      },
      {
        title: 'The block never starts a timer',
        rationale:
          'The status board only changes when Refresh is pressed. Polling, if an app wants it, belongs in its data layer, so the template has none.',
      },
    ],
    limitations: [
      'No system is monitored. Refreshing only moves the “checked at” time forward by a minute.',
      'The alert inbox has a fixed set of types, so its filter still lists Mentions and Security, which this app never produces. Two types are relabelled and the others stay.',
      'Alerts and the log are derived from the dashboard’s incidents, so they cannot show anything the dashboard does not.',
      'Search, filters, and the chosen sort reset when you leave the incident log, and everything resets on reload.',
      'Select menus render on the page rather than inside the preview frame, so they do not follow the preview theme.',
    ],
    files: [
      'src/templates/operations-monitoring/template.tsx',
      'src/templates/shared/template-shell.tsx',
      'src/templates/shared/format.ts',
    ],
    mockData: [
      { label: 'Monitoring dashboard', path: 'src/registry/monitoring-dashboard/mock-data.ts' },
    ],
  },
  {
    slug: 'data-management-workspace',
    title: 'Data management workspace',
    summary:
      'A data workspace: a searchable library with bulk actions and a detail panel, a team page with create, edit, and delete, and a history of every change.',
    scenario:
      'A made-up content workspace. The records, people, and changes are invented and held in memory, and nothing is saved.',
    status: 'experimental',
    tags: ['selection', 'sorting', 'pagination', 'form', 'responsive'],
    views: [
      {
        label: 'Library',
        summary:
          'Search, filter, and sort records; select several; mark them deprecated or delete them; open one’s details.',
        blocks: ['search-filter-toolbar', 'data-table', 'confirm-action', 'detail-panel'],
      },
      {
        label: 'People',
        summary: 'A team table with add, edit, and delete, validated by the form.',
        blocks: ['crud-management-page'],
      },
      {
        label: 'Change history',
        summary: 'Every change made in the library or the team, newest first.',
        blocks: ['activity-list', 'empty-state'],
      },
    ],
    composition: [
      'The library records, the team members, and the change history are held in the template. A deletion in the library or a new member shows up in the history, and the sidebar badge counts the changes.',
      'The toolbar holds no data: the Library view keeps its value, filters and sorts with a plain function, and gives the table the result, so the data path stays visible in the source.',
      'Bulk actions use the table’s controlled selection. Deleting asks for confirmation first, and the detail panel opens from a button in each row.',
    ],
    decisions: [
      {
        title: 'The toolbar filters, not the table',
        rationale:
          'The toolbar reports a complete value and filters nothing. Filtering with one function in the template keeps the result count, the table, and the empty state in agreement.',
      },
      {
        title: 'Every mutation is recorded in one place',
        rationale:
          'A single record function writes the history, so a new kind of change is one call. Timestamps count minutes from a fixed time instead of reading the clock, which keeps the example the same on every visit.',
      },
      {
        title: 'The detail panel is always a sheet',
        rationale:
          'By default the panel goes inline above a window width, which would ignore the preview frame. Passing a query that never matches keeps it a sheet at every preview width.',
      },
    ],
    limitations: [
      'Records and people live in memory, so reloading restores the original data.',
      'Search, filters, and the selection in the library reset when you leave it. The records and the change history are kept.',
      'Sorting comes from the toolbar only. The table’s own column sorting is not used.',
      'The table pages and sorts in the browser, which suits a short list. A large data set would need server-side paging and sorting.',
      'The detail sheet and the add, edit, and delete dialogs render on the page rather than inside the preview frame, so they ignore the chosen width and theme.',
    ],
    files: [
      'src/templates/data-management-workspace/template.tsx',
      'src/templates/shared/template-shell.tsx',
      'src/templates/shared/format.ts',
    ],
    mockData: [
      { label: 'Library items', path: 'src/registry/search-filter-toolbar/mock-data.ts' },
      { label: 'Team members', path: 'src/registry/crud-management-page/mock-data.ts' },
    ],
  },
]

export function getTemplate(slug: string): Template | undefined {
  return templates.find((template) => template.slug === slug)
}

export function templateHref(template: Pick<Template, 'slug'>): string {
  return `/templates/${template.slug}`
}

/** The distinct registry block slugs a template is built from, in the order its views use them. */
export function templateBlocks(template: Template): string[] {
  return [...new Set(template.views.flatMap((view) => view.blocks))]
}

import { activityListEntry } from './activity-list/meta'
import { alertEntry } from './alert/meta'
import { badgeEntry } from './badge/meta'
import { breadcrumbEntry } from './breadcrumb/meta'
import { buttonEntry } from './button/meta'
import { cardEntry } from './card/meta'
import { checkboxEntry } from './checkbox/meta'
import { confirmActionEntry } from './confirm-action/meta'
import { crudManagementPageEntry } from './crud-management-page/meta'
import { dashboardOverviewEntry } from './dashboard-overview/meta'
import { dataTableEntry } from './data-table/meta'
import { dataToolbarEntry } from './data-toolbar/meta'
import { detailPanelEntry } from './detail-panel/meta'
import { dialogEntry } from './dialog/meta'
import { emptyStateEntry } from './empty-state/meta'
import { errorStateEntry } from './error-state/meta'
import { fieldEntry } from './field/meta'
import { formFeedbackEntry } from './form-feedback/meta'
import { formEntry } from './form/meta'
import { inputEntry } from './input/meta'
import { kbdEntry } from './kbd/meta'
import { labelEntry } from './label/meta'
import { metricCardEntry } from './metric-card/meta'
import { monitoringDashboardEntry } from './monitoring-dashboard/meta'
import { multiStepOnboardingEntry } from './multi-step-onboarding/meta'
import { notificationCenterEntry } from './notification-center/meta'
import { notificationItemEntry } from './notification-item/meta'
import { ordersDashboardEntry } from './orders-dashboard/meta'
import { paginationEntry } from './pagination/meta'
import { passwordInputEntry } from './password-input/meta'
import { profileFormEntry } from './profile-form/meta'
import { resourceListEntry } from './resource-list/meta'
import { searchFilterFormEntry } from './search-filter-form/meta'
import { searchFilterToolbarEntry } from './search-filter-toolbar/meta'
import { searchInputEntry } from './search-input/meta'
import { selectEntry } from './select/meta'
import { separatorEntry } from './separator/meta'
import { sheetEntry } from './sheet/meta'
import { signInPageEntry } from './sign-in-page/meta'
import { skeletonEntry } from './skeleton/meta'
import { sparklineEntry } from './sparkline/meta'
import { spinnerEntry } from './spinner/meta'
import { statusBadgeEntry } from './status-badge/meta'
import { switchEntry } from './switch/meta'
import { tableEntry } from './table/meta'
import { tabsEntry } from './tabs/meta'
import { textareaEntry } from './textarea/meta'
import { tooltipEntry } from './tooltip/meta'
import { userProfileSettingsEntry } from './user-profile-settings/meta'
import { defaultCatalogQuery, toSearchParams, type CatalogQuery } from './catalog'
import { comboboxEntry } from './planned'
import {
  isImplemented,
  type ImplementedEntry,
  type RegistryEntry,
  type RegistryKind,
} from './types'
import { assertValidRegistry } from './validate'

/**
 * The single source of truth for every component and block. The sidebar, search,
 * index pages, detail pages, landing page, and About page all read from it.
 * Alphabetical; navigation follows this order.
 */
export const registry: readonly RegistryEntry[] = [
  activityListEntry,
  alertEntry,
  badgeEntry,
  breadcrumbEntry,
  buttonEntry,
  cardEntry,
  checkboxEntry,
  comboboxEntry,
  confirmActionEntry,
  crudManagementPageEntry,
  dashboardOverviewEntry,
  dataTableEntry,
  dataToolbarEntry,
  detailPanelEntry,
  dialogEntry,
  emptyStateEntry,
  errorStateEntry,
  fieldEntry,
  formEntry,
  formFeedbackEntry,
  inputEntry,
  kbdEntry,
  labelEntry,
  metricCardEntry,
  monitoringDashboardEntry,
  multiStepOnboardingEntry,
  notificationCenterEntry,
  notificationItemEntry,
  ordersDashboardEntry,
  paginationEntry,
  passwordInputEntry,
  profileFormEntry,
  resourceListEntry,
  searchFilterFormEntry,
  searchFilterToolbarEntry,
  searchInputEntry,
  selectEntry,
  separatorEntry,
  sheetEntry,
  signInPageEntry,
  skeletonEntry,
  sparklineEntry,
  spinnerEntry,
  statusBadgeEntry,
  switchEntry,
  tableEntry,
  tabsEntry,
  textareaEntry,
  tooltipEntry,
  userProfileSettingsEntry,
]

// Fail loudly while developing; tests run the same validation in CI.
if (import.meta.env.DEV) assertValidRegistry(registry)

/** Where each kind's index and detail pages live. */
export const kindBasePath: Record<RegistryKind, string> = {
  component: '/components',
  block: '/blocks',
}

export function getRegistryEntry(slug: string, kind?: RegistryKind): RegistryEntry | undefined {
  return registry.find(
    (entry) => entry.slug === slug && (kind === undefined || entry.kind === kind),
  )
}

export function getRegistryEntries(kind: RegistryKind): RegistryEntry[] {
  return registry.filter((entry) => entry.kind === kind)
}

/** An implemented entry, or undefined when the slug is unknown or only planned. */
export function getImplementedEntry(
  slug: string,
  kind?: RegistryKind,
): ImplementedEntry | undefined {
  const entry = getRegistryEntry(slug, kind)
  return entry && isImplemented(entry) ? entry : undefined
}

export function registryHref(entry: Pick<RegistryEntry, 'kind' | 'slug'>): string {
  return `${kindBasePath[entry.kind]}/${entry.slug}`
}

/** A kind's catalog URL with `query` applied, e.g. `/components?category=actions`. */
export function catalogHref(kind: RegistryKind, query: Partial<CatalogQuery> = {}): string {
  const search = toSearchParams({ ...defaultCatalogQuery, ...query }).toString()
  return search ? `${kindBasePath[kind]}?${search}` : kindBasePath[kind]
}

import type { Locator, Page } from '@playwright/test'

import { expect, test } from './fixtures'

const desktop = { width: 1440, height: 900 }
const mobile = { width: 360, height: 740 }

const templates = [
  { slug: 'admin-dashboard', title: 'Admin dashboard', app: 'Workspace admin' },
  { slug: 'operations-monitoring', title: 'Operations monitoring', app: 'Operations console' },
  {
    slug: 'data-management-workspace',
    title: 'Data management workspace',
    app: 'Content workspace',
  },
] as const

/** The live preview of a template: a region named by the preview's own heading. */
function preview(page: Page, title: string) {
  return page.getByRole('region', { name: `${title} template`, exact: true })
}

function appNav(scope: Locator, app: string) {
  return scope.getByRole('navigation', { name: `${app} sections` })
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('the templates gallery', () => {
  test('lists the three templates and opens each from its card', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates')
    await expect(page.getByRole('heading', { level: 1, name: 'Templates' })).toBeVisible()
    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText(
      templates.map((template) => template.title),
    )

    for (const template of templates) {
      await page.goto('/templates')
      await page.getByRole('main').getByRole('link', { name: template.title }).click()
      await expect(page).toHaveURL(new RegExp(`/templates/${template.slug}$`))
      await expect(page.getByRole('heading', { level: 1, name: template.title })).toBeVisible()
      await expect(page).toHaveTitle(`${template.title} · Hieu UI Lab`)
    }
  })

  test('is reachable from the header, the sidebar, and the landing page', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Templates' })
      .click()
    await expect(page).toHaveURL(/\/templates$/)
    await expect(
      page
        .getByRole('navigation', { name: 'Registry' })
        .getByRole('link', { name: 'All templates' }),
    ).toHaveAttribute('aria-current', 'page')

    await page
      .getByRole('navigation', { name: 'Registry' })
      .getByRole('link', { name: /^Admin dashboard/ })
      .click()
    await expect(page).toHaveURL(/\/templates\/admin-dashboard$/)

    await page.goto('/')
    const section = page.getByRole('region', { name: 'Templates' })
    await section.getByRole('link', { name: 'Operations monitoring' }).click()
    await expect(page).toHaveURL(/\/templates\/operations-monitoring$/)
  })

  test('is found by the search palette', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('ControlOrMeta+k')
    await page.getByRole('combobox', { name: 'Search documentation' }).fill('monitoring')
    await expect(page.getByRole('option', { name: /Operations monitoring/ })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(
      /\/(templates\/operations-monitoring|blocks\/monitoring-dashboard)$/,
    )
  })

  test('shows an unknown template as not found, with a way back', async ({ page }) => {
    await page.goto('/templates/nope')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Browse Templates' }).click()
    await expect(page).toHaveURL(/\/templates$/)
  })
})

test.describe('admin dashboard', () => {
  test('moves between views, keeps its state, and badges unread notifications', async ({
    page,
  }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')
    const nav = appNav(app, 'Workspace admin')
    await expect(nav.getByRole('button', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // The range chosen on Overview survives a visit to another view.
    await app.getByRole('tab', { name: 'Last 30 days' }).click()
    await nav.getByRole('button', { name: 'Settings' }).click()
    await expect(app.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible()
    await nav.getByRole('button', { name: 'Overview' }).click()
    await expect(app.getByRole('tab', { name: 'Last 30 days' })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    // Reading a notification lowers the count in the sidebar.
    await expect(nav.getByRole('button', { name: 'Notifications, 4 unread' })).toBeVisible()
    await nav.getByRole('button', { name: /^Notifications/ }).click()
    await app.getByRole('button', { name: /^Mark as read: Lan Anh/ }).click()
    await expect(nav.getByRole('button', { name: 'Notifications, 3 unread' })).toBeVisible()
    await app.getByRole('button', { name: 'Mark all as read' }).click()
    await expect(nav.getByRole('button', { name: 'Notifications', exact: true })).toBeVisible()
  })

  test('validates settings, and says unsaved edits are lost when leaving the view', async ({
    page,
  }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')
    const nav = appNav(app, 'Workspace admin')

    await nav.getByRole('button', { name: 'Settings' }).click()
    const name = app.getByRole('textbox', { name: 'Display name' })
    await name.fill('Alexandra')
    await app.getByRole('tab', { name: 'Security' }).click()
    const panel = app.getByRole('tabpanel', { name: 'Security' })
    await panel.getByLabel('Current password').fill('old password')
    await panel.getByLabel(/^New password/).fill('a much longer secret')
    await panel.getByLabel('Confirm new password').fill('something else entirely')
    await panel.getByRole('button', { name: 'Change password' }).click()
    await expect(panel.getByText('The passwords don’t match.')).toBeVisible()

    await nav.getByRole('button', { name: 'Overview' }).click()
    await nav.getByRole('button', { name: 'Settings' }).click()
    await expect(name).not.toHaveValue('Alexandra')
  })

  test('shows every view loading and failing, then recovers on retry', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')

    await app.getByRole('radio', { name: 'Loading' }).check()
    await expect(app.getByText('Loading overview…')).toBeAttached()

    await app.getByRole('radio', { name: 'Error' }).check()
    await expect(app.getByRole('alert')).toContainText('did not respond')
    await app.getByRole('button', { name: 'Try again' }).click()
    await expect(app.getByRole('radio', { name: 'Loaded' })).toBeChecked()
    await expect(app.getByRole('tab', { name: 'Last 7 days' })).toBeVisible()
  })

  test('shows the source it runs from in the Code tab', async ({ page }) => {
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')
    await app.getByRole('tab', { name: 'Code' }).click()
    await expect(app.getByRole('tabpanel', { name: 'Code' })).toContainText(
      'export function AdminDashboardTemplate',
    )
  })
})

test.describe('operations monitoring', () => {
  test('refresh moves the checked time, and the time survives a change of view', async ({
    page,
  }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/operations-monitoring')
    const app = preview(page, 'Operations monitoring')
    const nav = appNav(app, 'Operations console')
    await expect(app.getByText(/Checked at .*6:00 PM UTC/)).toBeVisible()

    await app.getByRole('button', { name: 'Refresh' }).click()
    await expect(app.getByText(/Checked at .*6:01 PM UTC/)).toBeVisible()

    await nav.getByRole('button', { name: /^Alerts/ }).click()
    await nav.getByRole('button', { name: 'Service status' }).click()
    await expect(app.getByText(/Checked at .*6:01 PM UTC/)).toBeVisible()
  })

  test('turns incidents into alerts and counts the open ones', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/operations-monitoring')
    const app = preview(page, 'Operations monitoring')
    const nav = appNav(app, 'Operations console')
    await expect(nav.getByRole('button', { name: 'Alerts, 2 unread' })).toBeVisible()

    await nav.getByRole('button', { name: /^Alerts/ }).click()
    await expect(app.getByText('Background jobs are not processing')).toBeVisible()
    await app
      .getByRole('button', { name: 'Mark as read: Background jobs are not processing' })
      .click()
    await expect(nav.getByRole('button', { name: 'Alerts, 1 unread' })).toBeVisible()
  })

  test('narrows the incident log with a saved view and a search', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/operations-monitoring')
    const app = preview(page, 'Operations monitoring')
    await appNav(app, 'Operations console').getByRole('button', { name: 'Incident log' }).click()

    await expect(app.getByText('6 events')).toBeVisible()
    await app.getByRole('button', { name: 'Open', exact: true }).click()
    await expect(app.getByText('2 events')).toBeVisible()
    await app.getByRole('button', { name: 'All incidents' }).click()

    await app.getByRole('searchbox', { name: 'Search incidents' }).fill('zzz')
    await expect(app.getByRole('heading', { name: 'No incidents match' })).toBeVisible()
    await app.getByRole('button', { name: 'Clear everything' }).click()
    await expect(app.getByText('6 events')).toBeVisible()
  })
})

test.describe('data management workspace', () => {
  test('deletes the selection after confirmation and records it in the history', async ({
    page,
  }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/data-management-workspace')
    const app = preview(page, 'Data management workspace')
    const nav = appNav(app, 'Content workspace')
    await expect(app.getByText('12 of 12 items')).toBeVisible()

    await app.getByRole('checkbox', { name: 'Select Banner' }).check()
    await app.getByRole('checkbox', { name: 'Select Data grid' }).check()
    await expect(app.getByText('2 selected', { exact: true })).toBeVisible()
    await app.getByRole('button', { name: 'Delete…' }).click()
    await page
      .getByRole('dialog', { name: 'Delete 2 items?' })
      .getByRole('button', { name: 'Delete', exact: true })
      .click()

    await expect(app.getByText('10 of 10 items')).toBeVisible()
    await expect(nav.getByRole('button', { name: 'Change history, 1 change' })).toBeVisible()
    await nav.getByRole('button', { name: /^Change history/ }).click()
    await expect(app.getByRole('list', { name: 'Change history' })).toContainText(
      'You deleted 2 library items',
    )
  })

  test('opens an item’s details in a sheet and returns focus when it closes', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/data-management-workspace')
    const app = preview(page, 'Data management workspace')
    const opener = app.getByRole('button', { name: 'Details for Banner' })

    await opener.click()
    const sheet = page.getByRole('dialog', { name: 'Banner' })
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
    await expect(opener).toBeFocused()
  })

  test('adds a team member and records the invitation', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/data-management-workspace')
    const app = preview(page, 'Data management workspace')
    const nav = appNav(app, 'Content workspace')

    await nav.getByRole('button', { name: 'People' }).click()
    await app.getByRole('button', { name: 'Add member' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add member' })
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Mira Solano')
    await dialog.getByRole('textbox', { name: 'Email' }).fill('mira@example.com')
    await dialog.getByRole('combobox', { name: 'Role' }).click()
    await page.getByRole('option', { name: 'Editor', exact: true }).click()
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await expect(dialog).toBeHidden()

    await nav.getByRole('button', { name: /^Change history/ }).click()
    await expect(app.getByRole('list', { name: 'Change history' })).toContainText(
      'You invited Mira Solano',
    )
  })

  test('explains an empty library and recovers from an error', async ({ page }) => {
    await page.goto('/templates/data-management-workspace')
    const app = preview(page, 'Data management workspace')

    await app.getByRole('radio', { name: 'No records' }).check()
    await expect(app.getByRole('heading', { name: 'The library is empty' })).toBeVisible()
    await app.getByRole('radio', { name: 'Error' }).check()
    await expect(app.getByRole('alert')).toContainText('did not respond')
    await app.getByRole('button', { name: 'Try again' }).click()
    await expect(app.getByText('12 of 12 items')).toBeVisible()
  })
})

test.describe('the preview width', () => {
  for (const template of templates) {
    test(`${template.title}: the views sit beside the content when wide and above it when narrow`, async ({
      page,
    }) => {
      await page.setViewportSize(desktop)
      await page.goto(`/templates/${template.slug}`)
      const app = preview(page, template.title)
      const frame = app.getByRole('group', { name: `${template.title} template preview` })
      const nav = appNav(app, template.app)
      const content = frame.getByRole('heading', { level: 2 }).first()

      await expect(app.getByRole('radio', { name: 'Full' })).toBeChecked()
      let navBox = await nav.boundingBox()
      let contentBox = await content.boundingBox()
      expect(navBox && contentBox && contentBox.x >= navBox.x + navBox.width - 1).toBe(true)

      await app.getByRole('radio', { name: 'Mobile 375px' }).check()
      await expect(frame).toHaveAttribute('data-viewport', 'mobile')
      navBox = await nav.boundingBox()
      contentBox = await content.boundingBox()
      expect(navBox && contentBox && contentBox.y >= navBox.y + navBox.height - 1).toBe(true)
    })

    test(`${template.title}: has no horizontal overflow at a mobile width`, async ({ page }) => {
      await page.setViewportSize(mobile)
      await page.goto(`/templates/${template.slug}`)
      const app = preview(page, template.title)
      await expect(appNav(app, template.app)).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)

      await app.getByRole('radio', { name: 'Mobile 375px' }).check()
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    })
  }

  test('keeps the app’s state when the width changes or the code is shown', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')
    const nav = appNav(app, 'Workspace admin')

    await nav.getByRole('button', { name: /^Notifications/ }).click()
    await app.getByRole('radio', { name: 'Tablet 768px' }).check()
    await app.getByRole('tab', { name: 'Code' }).click()
    await app.getByRole('tab', { name: 'Preview' }).click()

    await expect(nav.getByRole('button', { name: /^Notifications/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })
})

test.describe('keyboard use', () => {
  test('a view is chosen with Tab and Enter, and the choice is announced', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/templates/admin-dashboard')
    const app = preview(page, 'Admin dashboard')
    const nav = appNav(app, 'Workspace admin')

    await nav.getByRole('button', { name: 'Overview' }).focus()
    await page.keyboard.press('Tab')
    await expect(nav.getByRole('button', { name: /^Notifications/ })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(app.getByRole('heading', { level: 2, name: 'Notifications' })).toBeVisible()
    await expect(app.getByText('Showing Notifications')).toBeAttached()
    // Focus stays on the control that was used.
    await expect(nav.getByRole('button', { name: /^Notifications/ })).toBeFocused()
  })
})

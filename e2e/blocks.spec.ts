import { expect, test, type Locator, type Page } from '@playwright/test'

const mobile = { width: 360, height: 740 }
const desktop = { width: 1440, height: 900 }

/** One example on a detail page: a region named by the example's heading. */
function example(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true })
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

/** Radix Select: open it, then pick from the portalled list. */
async function choose(page: Page, scope: Locator, name: string, option: string) {
  await scope.getByRole('combobox', { name }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test.describe('notification center', () => {
  test('filters to unread, marks items read, and keeps focus on the next one', async ({ page }) => {
    await page.goto('/blocks/notification-center')
    const demo = example(page, 'Inbox')
    const status = demo.getByRole('status')
    await expect(status).toHaveText('4 unread')

    await demo.getByRole('tab', { name: 'Unread (4)' }).click()
    await expect(demo.getByRole('article')).toHaveCount(4)

    await demo.getByRole('button', { name: /^Mark as read: Lan Anh/ }).click()
    await expect(demo.getByRole('article')).toHaveCount(3)
    await expect(status).toHaveText('3 unread')
    // The button that was pressed is gone with its item; focus moves on instead of dropping.
    await expect(demo.getByRole('button', { name: /^Mark as read: Bruno Alves/ })).toBeFocused()

    await demo.getByRole('button', { name: 'Mark all as read' }).click()
    await expect(status).toHaveText('You’re all caught up.')
    await expect(demo.getByRole('heading', { name: 'You’re all caught up' })).toBeVisible()
    await expect(demo.getByRole('button', { name: 'Mark all as read' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })

  test('filters by type', async ({ page }) => {
    await page.goto('/blocks/notification-center')
    const demo = example(page, 'Inbox')

    await choose(page, demo, 'Filter by type', 'Security')

    await expect(demo.getByRole('article')).toHaveCount(2)
    await expect(demo.getByText('New sign-in from Chrome on macOS')).toBeVisible()
  })

  test('shows loading and error states, and recovers on retry', async ({ page }) => {
    await page.goto('/blocks/notification-center')
    const demo = example(page, 'Loading, empty, and error')
    await expect(demo.getByText('Loading notifications…')).toBeAttached()

    await demo.getByRole('radio', { name: 'Error' }).check()
    await expect(demo.getByRole('alert')).toContainText('did not respond')

    await demo.getByRole('button', { name: 'Try again' }).click()
    await expect(demo.getByRole('article')).toHaveCount(8)
  })
})

test.describe('sign-in page', () => {
  test('validates, then reports success', async ({ page }) => {
    await page.goto('/blocks/sign-in-page')
    const demo = example(page, 'Email and password')
    const email = demo.getByRole('textbox', { name: 'Email' })

    await demo.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(email).toBeFocused()
    await expect(email).toHaveAttribute('aria-invalid', 'true')
    await expect(demo.getByText('Enter your password.')).toBeVisible()

    await email.fill('alex@example.com')
    await demo.locator('input[autocomplete="current-password"]').fill('anything-at-all')
    await demo.getByRole('button', { name: 'Sign in', exact: true }).click()

    await expect(demo.getByRole('status')).toContainText('no session was created')
  })

  test('works with the keyboard alone', async ({ page }) => {
    await page.goto('/blocks/sign-in-page')
    const demo = example(page, 'Email and password')

    await demo.getByRole('textbox', { name: 'Email' }).focus()
    await page.keyboard.type('alex@example.com')
    await page.keyboard.press('Tab')
    await page.keyboard.type('anything-at-all')
    await page.keyboard.press('Enter')

    await expect(demo.getByRole('status')).toContainText('Signed in as alex@example.com')
  })

  test('shows a wrong password on the field, and the other failures', async ({ page }) => {
    await page.goto('/blocks/sign-in-page')
    const demo = example(page, 'Outcomes and single sign-on')
    const password = demo.locator('input[autocomplete="current-password"]')
    await demo.getByRole('textbox', { name: 'Email' }).fill('alex@example.com')
    await password.fill('anything-at-all')

    await demo.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(demo.getByRole('alert')).toContainText('Check your details')
    await expect(password).toHaveAttribute('aria-invalid', 'true')
    await expect(password).toBeFocused()

    await demo.getByRole('radio', { name: 'Account locked' }).check()
    await demo.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(demo.getByRole('alert')).toContainText('temporarily locked')

    await demo.getByRole('radio', { name: 'Service unavailable' }).check()
    await demo.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(demo.getByRole('alert')).toContainText('couldn’t sign you in right now')
  })

  test('offers single sign-on when a handler is given', async ({ page }) => {
    await page.goto('/blocks/sign-in-page')
    const demo = example(page, 'Outcomes and single sign-on')

    await demo.getByRole('button', { name: 'Continue with single sign-on' }).click()

    await expect(demo.getByText('Single sign-on pressed 1 time (example only).')).toBeVisible()
  })
})

test.describe('multi-step onboarding', () => {
  test('checks each step, keeps answers, and creates the workspace', async ({ page }) => {
    await page.goto('/blocks/multi-step-onboarding')
    const demo = example(page, 'Onboarding')
    const stepHeading = (name: string) => demo.getByRole('heading', { level: 3, name })

    await demo.getByRole('button', { name: 'Next' }).click()
    await expect(demo.getByRole('textbox', { name: 'Full name' })).toBeFocused()
    await expect(demo.getByText('Enter your name (at least 2 characters).')).toBeVisible()
    await expect(stepHeading('Profile')).toBeVisible()

    await demo.getByRole('textbox', { name: 'Full name' }).fill('Alex Nguyen')
    await choose(page, demo, 'Your role', 'Designer')
    await demo.getByRole('button', { name: 'Next' }).click()
    await expect(stepHeading('Workspace')).toBeFocused()
    await expect(demo.locator('[aria-current="step"]')).toContainText('Workspace')

    await demo.getByRole('button', { name: 'Back' }).click()
    await expect(demo.getByRole('textbox', { name: 'Full name' })).toHaveValue('Alex Nguyen')
    await demo.getByRole('button', { name: 'Next' }).click()

    await demo.getByRole('textbox', { name: 'Workspace name' }).fill('Atlas Studio')
    await demo.getByRole('textbox', { name: 'Workspace address' }).fill('atlas-studio')
    await choose(page, demo, 'Team size', '2–10 people')
    await demo.getByRole('button', { name: 'Next' }).click()

    await choose(page, demo, 'What do you want to do first?', 'Ship a project')
    await demo.getByRole('button', { name: 'Review' }).click()
    await expect(stepHeading('Review')).toBeFocused()
    await expect(demo.getByText('atlas-studio')).toBeVisible()

    await demo.getByRole('button', { name: 'Create workspace' }).click()
    await expect(demo.getByRole('heading', { name: 'Your workspace is ready' })).toBeFocused()
    await expect(demo.getByRole('status')).toContainText('nothing was created')
  })

  test('goes back to the step with a field the server rejected', async ({ page }) => {
    await page.goto('/blocks/multi-step-onboarding')
    const demo = example(page, 'Server errors')

    await demo.getByRole('button', { name: 'Create workspace' }).click()

    await expect(demo.getByRole('heading', { level: 3, name: 'Workspace' })).toBeVisible()
    const slug = demo.getByRole('textbox', { name: 'Workspace address' })
    await expect(slug).toHaveAttribute('aria-invalid', 'true')
    await expect(slug).toBeFocused()
    await expect(demo.getByRole('alert')).toContainText('Workspace not created')
  })
})

test.describe('CRUD management page', () => {
  test('searches, adds, rejects a duplicate, and deletes', async ({ page }) => {
    await page.goto('/blocks/crud-management-page')
    const demo = example(page, 'Members')
    const search = demo.getByRole('searchbox', { name: 'Search members' })

    await search.fill('nguyen')
    await expect(demo.getByRole('rowheader')).toHaveCount(1)
    await expect(demo.getByRole('rowheader')).toContainText('Dũng Nguyễn')
    await search.fill('')

    await demo.getByRole('button', { name: 'Add member' }).click()
    const dialog = page.getByRole('dialog', { name: 'Add member' })
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toBeFocused()

    await dialog.getByRole('textbox', { name: 'Name' }).fill('Zed Zimmer')
    await dialog.getByRole('textbox', { name: 'Email' }).fill('lananh@example.com')
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await expect(dialog.getByText('Someone with this email is already a member.')).toBeVisible()
    await expect(dialog.getByRole('textbox', { name: 'Email' })).toBeFocused()

    await dialog.getByRole('textbox', { name: 'Email' }).fill('zed@example.com')
    await dialog.getByRole('button', { name: 'Add member' }).click()
    await expect(dialog).toBeHidden()
    await expect(demo.getByText('Added Zed Zimmer.')).toBeAttached()

    await search.fill('zed')
    await expect(demo.getByRole('rowheader')).toHaveCount(1)
    await demo.getByRole('button', { name: 'Delete Zed Zimmer' }).click()
    await page
      .getByRole('dialog', { name: 'Delete this member?' })
      .getByRole('button', { name: 'Delete member' })
      .click()

    await expect(demo.getByText('Deleted Zed Zimmer.')).toBeAttached()
    await expect(demo.getByRole('heading', { level: 2, name: 'Team members' })).toBeFocused()
  })

  test('edits a member and shows the change', async ({ page }) => {
    await page.goto('/blocks/crud-management-page')
    const demo = example(page, 'Members')

    await demo.getByRole('button', { name: 'Edit Bruno Alves' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit member' })
    await expect(dialog.getByRole('textbox', { name: 'Name' })).toHaveValue('Bruno Alves')
    await dialog.getByRole('textbox', { name: 'Name' }).fill('Bruno A.')
    await dialog.getByRole('button', { name: 'Save changes' }).click()

    await expect(dialog).toBeHidden()
    await expect(demo.getByRole('rowheader', { name: /Bruno A\./ })).toBeVisible()
  })

  test('explains an empty result and recovers', async ({ page }) => {
    await page.goto('/blocks/crud-management-page')
    const demo = example(page, 'Members')

    await demo.getByRole('searchbox', { name: 'Search members' }).fill('zzzz')
    await expect(demo.getByRole('heading', { name: 'No members match' })).toBeVisible()
    await demo.getByRole('button', { name: 'Clear filters' }).last().click()

    await expect(demo.getByRole('rowheader').first()).toBeVisible()
  })
})

test.describe('monitoring dashboard', () => {
  test('switches range and refreshes', async ({ page }) => {
    await page.goto('/blocks/monitoring-dashboard')
    const demo = example(page, 'Status board')
    const checked = demo.getByRole('status')
    await expect(checked).toContainText('6:00')
    await expect(
      demo.getByRole('img', { name: /^API gateway p95 latency, last 24 hours/ }),
    ).toBeVisible()

    await demo.getByRole('tab', { name: 'Last 7 days' }).click()
    await expect(
      demo.getByRole('img', { name: /^API gateway p95 latency, last 7 days/ }),
    ).toBeVisible()

    await demo.getByRole('button', { name: 'Refresh' }).click()
    await expect(demo.getByRole('button', { name: 'Refresh' })).toHaveAttribute('aria-busy', 'true')
    await expect(checked).toContainText('6:01')
    await expect(demo.getByRole('button', { name: 'Refresh' })).not.toHaveAttribute('aria-busy')
  })

  test('limits the grid to services with issues', async ({ page }) => {
    await page.goto('/blocks/monitoring-dashboard')
    const demo = example(page, 'Status board')
    const services = demo.getByRole('list', { name: 'Services' }).getByRole('listitem')
    await expect(services).toHaveCount(6)

    await demo.getByRole('switch', { name: 'Only services with issues' }).click()

    await expect(services).toHaveCount(3)
  })

  test('shows the error, a failed refresh, and recovers on retry', async ({ page }) => {
    await page.goto('/blocks/monitoring-dashboard')
    const demo = example(page, 'Quiet, empty, loading, and error')
    await expect(demo.getByText('Everything is running normally')).toBeVisible()

    await demo.getByRole('radio', { name: 'Error', exact: true }).check()
    await expect(demo.getByRole('alert')).toContainText('did not respond')
    await demo.getByRole('button', { name: 'Try again' }).click()
    await expect(demo.getByRole('list', { name: 'Incidents' })).toBeVisible()

    await demo.getByRole('radio', { name: 'Refresh fails' }).check()
    await demo.getByRole('button', { name: 'Refresh' }).click()
    await expect(demo.getByRole('alert')).toContainText('Couldn’t refresh')
  })
})

test.describe('user profile settings', () => {
  test('keeps edits across tabs and checks the new password', async ({ page }) => {
    await page.goto('/blocks/user-profile-settings')
    const demo = example(page, 'Account settings')

    const name = demo.getByRole('textbox', { name: 'Display name' })
    await name.fill('Alexandra')
    await demo.getByRole('tab', { name: 'Security' }).click()
    await expect(name).toBeHidden()

    const panel = demo.getByRole('tabpanel', { name: 'Security' })
    await panel.getByLabel('Current password').fill('old password')
    await panel.getByLabel(/^New password/).fill('a much longer secret')
    await panel.getByLabel('Confirm new password').fill('something else entirely')
    await panel.getByRole('button', { name: 'Change password' }).click()
    await expect(panel.getByText('The passwords don’t match.')).toBeVisible()

    await demo.getByRole('tab', { name: 'Profile' }).click()
    await expect(name).toHaveValue('Alexandra')
  })
})

test.describe('search and filter toolbar', () => {
  test('applies a saved view, then removes a chip', async ({ page }) => {
    await page.goto('/blocks/search-filter-toolbar')
    const demo = example(page, 'Saved views and active filters')
    const chips = demo.getByRole('list', { name: 'Active filters' }).getByRole('listitem')
    await expect(chips).toHaveCount(2)

    await demo.getByRole('button', { name: 'All items' }).click()
    await expect(demo.getByRole('list', { name: 'Active filters' })).toBeHidden()
    await expect(demo.getByRole('button', { name: 'All items' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await demo.getByRole('button', { name: 'Needs attention' }).click()
    await expect(chips).toHaveCount(1)
    await demo.getByRole('button', { name: 'Remove filter Status: Deprecated' }).click()
    await expect(demo.getByRole('search')).toBeFocused()
  })
})

test.describe('responsive preview', () => {
  test('resizes the block to the chosen width and it reflows', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/blocks/dashboard-overview')
    const demo = example(page, 'Workspace usage')
    const frame = demo.getByRole('group', { name: 'Workspace usage preview' })
    // The first grid in the block is the row of metric cards.
    const columns = () =>
      frame
        .locator('div.grid')
        .first()
        .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)
    const width = async () => (await frame.boundingBox())?.width ?? 0

    await expect(demo.getByRole('radio', { name: 'Full' })).toBeChecked()
    expect(await width()).toBeGreaterThan(832)
    await expect.poll(columns).toBe(4)

    await demo.getByRole('radio', { name: 'Tablet 768px' }).check()
    await expect(frame).toHaveAttribute('data-viewport', 'tablet')
    expect(await width()).toBe(768)
    await expect.poll(columns).toBe(2)

    await demo.getByRole('radio', { name: 'Mobile 375px' }).check()
    expect(await width()).toBe(375)
    await expect.poll(columns).toBe(1)

    await demo.getByRole('radio', { name: 'Full' }).check()
    await expect.poll(columns).toBe(4)
  })

  test('keeps the block’s state when the width changes or the code is shown', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/blocks/dashboard-overview')
    const demo = example(page, 'Workspace usage')
    const range = demo.getByRole('tab', { name: 'Last 30 days' })

    await range.click()
    await demo.getByRole('radio', { name: 'Mobile 375px' }).check()
    await expect(range).toHaveAttribute('aria-selected', 'true')

    await demo.getByRole('tab', { name: 'Code' }).click()
    await expect(demo.getByRole('tab', { name: 'Code' })).toHaveAttribute('aria-selected', 'true')
    await demo.getByRole('tab', { name: 'Preview' }).click()

    await expect(range).toHaveAttribute('aria-selected', 'true')
    await expect(demo.getByRole('radio', { name: 'Mobile 375px' })).toBeChecked()
  })

  test('is offered only to examples that opt in', async ({ page }) => {
    await page.goto('/components/button')

    await expect(page.getByRole('group', { name: 'Preview width' })).toHaveCount(0)
    await page.goto('/blocks/data-table')
    await expect(page.getByRole('group', { name: 'Preview width' })).toHaveCount(0)
  })

  test('scrolls inside its own region on a narrow screen without widening the page', async ({
    page,
  }) => {
    await page.setViewportSize(mobile)
    await page.goto('/blocks/dashboard-overview')
    const demo = example(page, 'Workspace usage')

    await demo.getByRole('radio', { name: 'Mobile 375px' }).check()

    const region = demo.getByRole('region', { name: 'Workspace usage preview, scrollable' })
    await expect(region).toBeVisible()
    await expect(region).toHaveAttribute('tabindex', '0')
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
  })

  test('reflows every block at a mobile width without overflowing the frame', async ({ page }) => {
    await page.setViewportSize(desktop)
    const slugs = [
      'crud-management-page',
      'dashboard-overview',
      'monitoring-dashboard',
      'multi-step-onboarding',
      'notification-center',
      'search-filter-toolbar',
      'sign-in-page',
      'user-profile-settings',
    ]

    for (const slug of slugs) {
      await page.goto(`/blocks/${slug}`)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const frame = page.getByRole('group', { name: /preview$/ }).first()
      await page.getByRole('radio', { name: 'Mobile 375px' }).first().check()
      await expect(frame).toHaveAttribute('data-viewport', 'mobile')
      // Nothing inside the 375px frame may be wider than the frame itself.
      const overflow = await frame.evaluate((element) => element.scrollWidth - element.clientWidth)
      expect(overflow, `${slug} overflows its 375px frame`).toBeLessThanOrEqual(0)
    }
  })
})

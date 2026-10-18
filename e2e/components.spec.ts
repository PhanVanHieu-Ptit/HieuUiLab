import { expect, test, type Page } from '@playwright/test'

const mobile = { width: 360, height: 740 }

/** One example on a detail page: a region named by the example's heading. */
function example(page: Page, title: string) {
  return page.getByRole('region', { name: title, exact: true })
}

test.describe('form controls', () => {
  test('Checkbox and Switch toggle with Space and are named by their labels', async ({ page }) => {
    await page.goto('/components/checkbox')
    const terms = page.getByRole('checkbox', { name: 'Accept the license terms' })
    await terms.focus()
    await page.keyboard.press('Space')
    await expect(terms).toBeChecked()

    const all = page.getByRole('checkbox', { name: 'All packages' })
    await expect(all).toHaveAttribute('aria-checked', 'mixed')
    await all.click()
    await expect(all).toBeChecked()
    await expect(page.getByRole('checkbox', { name: 'lucide-react' })).toBeChecked()

    await page.goto('/components/switch')
    const digest = page.getByRole('switch', { name: 'Weekly digest' })
    await digest.focus()
    await page.keyboard.press('Space')
    await expect(digest).toBeChecked()
    await expect(digest).toHaveAccessibleDescription('A summary arrives every Monday.')
  })

  test('Input reports validation through aria-invalid and a linked message', async ({ page }) => {
    await page.goto('/components/input')
    const slug = page.getByRole('textbox', { name: 'Slug' })
    await expect(slug).toHaveAttribute('aria-invalid', 'true')
    await slug.fill('my-component')
    await expect(slug).toHaveAttribute('aria-invalid', 'false')
    await expect(slug).toHaveAccessibleDescription('Published at /components/my-component')
  })
})

test.describe('Select', () => {
  test('opens with the keyboard, selects, and returns focus', async ({ page }) => {
    await page.goto('/components/select')
    const trigger = page.getByRole('combobox', { name: 'Sort by' })
    await trigger.focus()
    await page.keyboard.press('Enter')

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible()
    // Focus starts on the selected option once the list has positioned itself.
    await expect(page.getByRole('option', { name: 'Recently updated' })).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(listbox).toBeHidden()
    await expect(trigger).toHaveText('Name')
    await expect(trigger).toBeFocused()
    await expect(example(page, 'Controlled')).toContainText('Current value: name')
  })

  test('blocks submitting a required select, then submits the chosen value', async ({ page }) => {
    await page.goto('/components/select')
    const form = example(page, 'In a form')
    await form.getByRole('button', { name: 'Submit' }).click()
    await expect(form).not.toContainText('Submitted')

    await page.getByRole('combobox', { name: 'Framework' }).click()
    await page.getByRole('option', { name: 'Vue' }).click()
    await form.getByRole('button', { name: 'Submit' }).click()
    await expect(form).toContainText('Submitted framework=vue')
  })

  test('keeps the list inside a narrow viewport', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/components/select')
    await page.getByRole('combobox', { name: 'Time zone' }).click()
    const box = await page.getByRole('listbox').boundingBox()
    expect(box).not.toBeNull()
    if (!box) return
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(mobile.width)
    expect(box.y + box.height).toBeLessThanOrEqual(mobile.height)
  })
})

test.describe('overlays', () => {
  test('Tooltip opens on keyboard focus and closes on Escape', async ({ page }) => {
    await page.goto('/components/tooltip')
    const bold = page.getByRole('button', { name: 'Bold' })
    await bold.focus()
    await expect(page.getByRole('tooltip')).toContainText('Bold')
    await expect(bold).toHaveAccessibleDescription(/Bold/)

    await page.keyboard.press('Escape')
    await expect(page.getByRole('tooltip')).toBeHidden()
    await expect(bold).toBeFocused()
  })

  test('Tooltip stays open when Tab scrolls its trigger into view', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await page.goto('/components/tooltip')
    const bold = page.getByRole('button', { name: 'Bold' })
    await expect(bold).not.toBeInViewport()
    // The header and the sidebar come first, and the sidebar lists every docs page and entry, so
    // the number of Tab presses grows with the registry and the docs: keep the limit generous.
    for (let step = 0; step < 200; step += 1) {
      await page.keyboard.press('Tab')
      if (await bold.evaluate((element) => element === document.activeElement)) break
    }
    await expect(bold).toBeFocused()
    await expect(page.getByRole('tooltip')).toContainText('Bold')
    // Scrolling settles after focus; the tooltip must survive it.
    await page.waitForTimeout(300)
    await expect(page.getByRole('tooltip')).toBeVisible()
  })

  test('Dialog traps focus, submits its form, and fits a phone screen', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/components/dialog')
    const trigger = page.getByRole('button', { name: 'Rename project' })
    await trigger.click()

    const dialog = page.getByRole('dialog', { name: 'Rename project' })
    await expect(dialog).toBeVisible()
    const name = dialog.getByRole('textbox', { name: 'Name' })
    await expect(name).toBeFocused()

    for (let step = 0; step < 5; step += 1) {
      await page.keyboard.press('Tab')
      await expect(dialog.locator(':focus')).toHaveCount(1)
    }

    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    if (box) expect(box.x + box.width).toBeLessThanOrEqual(mobile.width)

    await name.fill('Renamed lab')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    await expect(example(page, 'Controlled form')).toContainText('Current name: Renamed lab')
  })

  test('a long Dialog scrolls its body while the footer stays visible', async ({ page }) => {
    await page.setViewportSize(mobile)
    await page.goto('/components/dialog')
    await page.getByRole('button', { name: 'Read license' }).click()
    const dialog = page.getByRole('dialog', { name: 'License' })
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeInViewport()
    await dialog.getByRole('heading', { name: 'Section 6' }).scrollIntoViewIfNeeded()
    await expect(dialog.getByRole('heading', { name: 'Section 6' })).toBeInViewport()
    await expect(dialog.getByRole('button', { name: 'Done' })).toBeInViewport()
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('animations are effectively instant', async ({ page }) => {
    await page.goto('/components/skeleton')
    const duration = await page
      .locator('.animate-pulse')
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration)
    expect(Number.parseFloat(duration)).toBeLessThan(0.001)

    await page.goto('/components/switch')
    const thumb = page.getByRole('switch', { name: 'Autosave' }).locator('span')
    const transition = await thumb.evaluate(
      (element) => getComputedStyle(element).transitionDuration,
    )
    expect(Number.parseFloat(transition)).toBeLessThan(0.001)
  })
})

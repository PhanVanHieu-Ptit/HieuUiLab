import { expect, test, type Page } from '@playwright/test'

const desktop = { width: 1440, height: 900 }
const mobile = { width: 360, height: 740 }

const repository = 'https://github.com/PhanVanHieu-Ptit/HieuUiLab'

const projects = [
  {
    slug: 'hieu-ui-lab-platform',
    title: 'Hieu UI Lab: a documentation site built on one typed registry',
  },
  {
    slug: 'hieu-ui-lab-component-library',
    title: 'Hieu UI Lab component library and design system',
  },
  {
    slug: 'geospatial-3d-experiments',
    title: 'Map projections and a WebGL scene, written from first principles',
  },
] as const

const sectionHeadings = [
  'Problem',
  'Scope and role',
  'Technical decisions',
  'Architecture overview',
  'Challenges and verified solutions',
  'Live demos',
  'Repository and deployment',
  'Known limitations and future improvements',
  'What “Public project” means',
]

/** The library page embeds a real block, and the block brings its own heading. */
function headingsFor(slug: string): string[] {
  if (slug !== 'hieu-ui-lab-component-library') return sectionHeadings
  const index = sectionHeadings.indexOf('Live demos') + 1
  return [...sectionHeadings.slice(0, index), 'Overview', ...sectionHeadings.slice(index)]
}

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
}

test.describe('the projects page', () => {
  test('says what a public project is, then lists the projects and the case studies', async ({
    page,
  }) => {
    await page.setViewportSize(desktop)
    await page.goto('/projects')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Projects and case studies' }),
    ).toBeVisible()
    await expect(page).toHaveTitle('Projects · Hieu UI Lab')

    const main = page.getByRole('main')
    await expect(main.getByRole('heading', { level: 2 })).toHaveText([
      'What “Public project” means',
      'Projects',
      'Engineering case studies',
    ])
    await expect(page.getByRole('complementary', { name: 'About public projects' })).toContainText(
      'not published here',
    )
    await expect(main.getByRole('heading', { level: 3 })).toHaveText([
      ...projects.map((project) => project.title),
      'A contrast-tested design system',
      'Registry-driven documentation',
    ])
    await expect(main.getByText('Public project', { exact: true })).toHaveCount(projects.length)
  })

  test('is reachable from the header and the landing page', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/')
    const section = page.getByRole('region', { name: 'Projects', exact: true })
    await expect(section.getByText('Public project', { exact: true })).toHaveCount(3)
    await section.getByRole('link', { name: projects[1].title }).click()
    await expect(page).toHaveURL(new RegExp(`/projects/${projects[1].slug}$`))

    await page.goto('/')
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Projects' })
      .click()
    await expect(page).toHaveURL(/\/projects$/)
  })

  test('still opens a case study', async ({ page }) => {
    await page.goto('/projects')
    await page.getByRole('link', { name: 'A contrast-tested design system' }).click()
    await expect(page).toHaveURL(/\/projects\/contrast-tested-design-system$/)
    await expect(page.getByText('Outcome')).toBeVisible()
  })

  test('shows an unknown project as not found, with a way back', async ({ page }) => {
    await page.goto('/projects/nope')
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
    await page.getByRole('link', { name: 'Browse Projects' }).click()
    await expect(page).toHaveURL(/\/projects$/)
  })
})

test.describe('a project page', () => {
  for (const project of projects) {
    test(`${project.slug}: sections, public label, repository, and deployment`, async ({
      page,
    }) => {
      await page.setViewportSize(desktop)
      await page.goto(`/projects/${project.slug}`)
      const main = page.getByRole('main')
      await expect(main.getByRole('heading', { level: 1, name: project.title })).toBeVisible()
      await expect(main.getByRole('heading', { level: 2 })).toHaveText(headingsFor(project.slug))
      await expect(main.getByText('Public project', { exact: true }).first()).toBeVisible()

      const repo = page.getByRole('region', { name: 'Repository and deployment' })
      const link = repo.getByRole('link', { name: /PhanVanHieu-Ptit\/HieuUiLab/ })
      await expect(link).toHaveAttribute('href', repository)
      await expect(link).toHaveAttribute('target', '_blank')
      await expect(link).toHaveAttribute('rel', /noreferrer/)
      // No deployment exists, and the page says so instead of linking something that is not there.
      await expect(repo.getByText('Not deployed yet')).toBeVisible()

      await expect(main.getByText('Trade-off:').first()).toBeVisible()
      await expect(
        main.getByText('Ideas for what to do next. None is promised or scheduled.'),
      ).toBeVisible()
    })

    test(`${project.slug}: every challenge links its evidence on GitHub`, async ({ page }) => {
      await page.goto(`/projects/${project.slug}`)
      const lists = page.getByRole('list', { name: 'Evidence' })
      await expect(lists.first()).toBeVisible()
      expect(await lists.count()).toBeGreaterThan(0)
      const hrefs = await lists
        .getByRole('link')
        .evaluateAll((links) => links.map((anchor) => anchor.getAttribute('href')))
      expect(hrefs.length).toBeGreaterThan(0)
      for (const href of hrefs) {
        expect(href).toMatch(new RegExp(`^${repository}/blob/main/[\\w./-]+$`))
      }
    })

    test(`${project.slug}: has no horizontal overflow at a mobile width`, async ({ page }) => {
      await page.setViewportSize(mobile)
      await page.goto(`/projects/${project.slug}`)
      await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible()
      await page.waitForLoadState('networkidle')
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
    })
  }

  test('the platform project runs a real registry example', async ({ page }) => {
    await page.goto('/projects/hieu-ui-lab-platform')
    const tabs = page.getByRole('tablist', { name: 'Variants example' })
    await tabs.getByRole('tab', { name: 'Code' }).click()
    await expect(page.getByRole('tabpanel', { name: 'Code' })).toContainText(
      'export function ButtonVariantsDemo',
    )
    await page.getByRole('link', { name: 'Open Button' }).click()
    await expect(page).toHaveURL(/\/components\/button$/)
  })

  test('the library project reflows a real block with the preview width', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/projects/hieu-ui-lab-component-library')
    const example = page.getByRole('region', { name: 'Workspace usage', exact: true })
    const frame = example.getByRole('group', { name: 'Workspace usage preview' })

    await expect(example.getByRole('radio', { name: 'Full' })).toBeChecked()
    await example.getByRole('radio', { name: 'Mobile 375px' }).check()
    await expect(frame).toHaveAttribute('data-viewport', 'mobile')
    expect((await frame.boundingBox())?.width).toBe(375)
  })

  test('the geospatial and 3D project runs both experiments in the page', async ({ page }) => {
    await page.setViewportSize(desktop)
    await page.goto('/projects/geospatial-3d-experiments')

    const map = page.getByRole('region', { name: 'Map projection explorer', exact: true })
    await expect(map.getByRole('tab', { name: 'Orthographic' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    const newYork = map.getByRole('row', { name: /New York/ })
    await expect(newYork).toContainText('No')
    await map.getByRole('slider', { name: 'Centre longitude' }).fill('-75')
    await expect(newYork).toContainText('Yes')

    // Headless browsers do not always have WebGL, and the scene says so when it does not.
    const scene = page.getByRole('region', {
      name: 'WebGL scene with motion controls',
      exact: true,
    })
    await expect(
      scene
        .getByRole('img', { name: 'A shaded cube in the site’s primary colour' })
        .or(scene.getByRole('heading', { name: 'WebGL is unavailable' })),
    ).toBeVisible()
  })
})

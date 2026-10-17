import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { mediaHeading } from '@/components/showcase/media-heading'
import { ShowcaseDetail } from '@/components/showcase/showcase-detail'
import { ShowcaseMediaList } from '@/components/showcase/showcase-media'
import { siteConfig } from '@/config/site'
import { projects } from '@/content/projects'
import { getShowcaseProject, showcaseProjects } from '@/content/showcase-projects'
import type { ShowcaseMedia, ShowcaseProject } from '@/content/showcase-types'
import { renderRoute } from '@/test/render'

function headingsOf(level: 2 | 3) {
  return within(screen.getByRole('main'))
    .getAllByRole('heading', { level })
    .map((heading) => heading.textContent)
}

describe('Projects index', () => {
  it('explains what a public project is before listing any', async () => {
    await renderRoute('/projects')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Projects and case studies' }),
    ).toBeInTheDocument()
    expect(headingsOf(2)).toEqual([
      'What “Public project” means',
      'Projects',
      'Engineering case studies',
    ])
    const note = screen.getByRole('complementary', { name: 'About public projects' })
    expect(note).toHaveTextContent('not published here')
  })

  it('lists every public project, labelled, then the case studies', async () => {
    await renderRoute('/projects')
    const titles = [...showcaseProjects.map((p) => p.title), ...projects.map((p) => p.title)]
    expect(headingsOf(3)).toEqual(titles)

    for (const project of showcaseProjects) {
      expect(screen.getByRole('link', { name: project.title })).toHaveAttribute(
        'href',
        `/projects/${project.slug}`,
      )
    }
    expect(screen.getAllByText('Public project')).toHaveLength(showcaseProjects.length)
  })

  it('opens a project and a case study from their cards', async () => {
    const user = userEvent.setup()
    const { router } = await renderRoute('/projects')
    await user.click(screen.getByRole('link', { name: showcaseProjects[0]?.title ?? '' }))
    expect(router.state.location.pathname).toBe(`/projects/${showcaseProjects[0]?.slug ?? ''}`)
  })
})

describe('Project detail', () => {
  it('shows the sections in the order a reader asks for them', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    const project = getShowcaseProject('hieu-ui-lab-platform')
    if (!project) throw new Error('Missing project')
    expect(screen.getByRole('heading', { level: 1, name: project.title })).toBeInTheDocument()
    expect(headingsOf(2)).toEqual([
      'Problem',
      'Scope and role',
      'Technical decisions',
      'Architecture overview',
      'Challenges and verified solutions',
      'Live demos',
      'Repository and deployment',
      'Known limitations and future improvements',
      'What “Public project” means',
    ])
  })

  it('labels the project public and gives its role and period', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    const facts = screen.getAllByRole('definition')
    expect(facts.map((fact) => fact.textContent)).toEqual(
      expect.arrayContaining(['Public project', 'Platform', '2026']),
    )
    expect(screen.getByText('Design and implementation (single author)')).toBeInTheDocument()
  })

  it('gives every decision a trade-off and every challenge evidence on GitHub', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    const project = getShowcaseProject('hieu-ui-lab-platform')
    if (!project) throw new Error('Missing project')

    expect(screen.getAllByText('Trade-off:')).toHaveLength(project.decisions.length)
    const evidence = screen.getAllByRole('list', { name: 'Evidence' })
    expect(evidence).toHaveLength(project.challenges.length)
    for (const list of evidence) {
      for (const link of within(list).getAllByRole('link')) {
        expect(link).toHaveAttribute(
          'href',
          expect.stringContaining(`${siteConfig.githubUrl}/blob/main/`),
        )
        expect(link).toHaveAttribute('target', '_blank')
        expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      }
    }
  })

  it('links the repository and says plainly that it is not deployed', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    const section = screen.getByRole('region', { name: 'Repository and deployment' })
    expect(
      within(section).getByRole('link', { name: /PhanVanHieu-Ptit\/HieuUiLab/ }),
    ).toHaveAttribute('href', siteConfig.githubUrl)
    expect(within(section).getByText('Not deployed yet')).toBeInTheDocument()
    expect(within(section).queryByText(/Link checked/)).toBeNull()
  })

  it('says the improvements are ideas, not promises', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    expect(
      screen.getByText('Ideas for what to do next. None is promised or scheduled.'),
    ).toBeVisible()
    expect(screen.getByRole('list', { name: 'Known limitations' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Future improvements' })).toBeInTheDocument()
  })

  it('links the case study that goes deeper', async () => {
    await renderRoute('/projects/hieu-ui-lab-component-library')
    expect(screen.getByRole('link', { name: 'A contrast-tested design system' })).toHaveAttribute(
      'href',
      '/projects/contrast-tested-design-system',
    )
  })

  it('runs a real registry example, not a picture of one', async () => {
    await renderRoute('/projects/hieu-ui-lab-platform')
    expect(screen.getByRole('link', { name: 'Open Button' })).toHaveAttribute(
      'href',
      '/components/button',
    )
    expect(screen.getByRole('tablist', { name: 'Variants example' })).toBeInTheDocument()
  })

  it('runs both lab experiments on the geospatial and 3D project', async () => {
    await renderRoute('/projects/geospatial-3d-experiments')
    expect(await screen.findByRole('tab', { name: 'Orthographic' })).toBeInTheDocument()
    // jsdom has no WebGL, so the scene shows its own explanation instead of a blank canvas.
    expect(await screen.findByText('WebGL is unavailable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Map projection explorer page/ })).toHaveAttribute(
      'href',
      '/labs/maps/map-projections',
    )
  })

  it('keeps a case study page working', async () => {
    await renderRoute('/projects/registry-driven-documentation')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Registry-driven documentation' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Outcome')).toBeInTheDocument()
    expect(screen.queryByText('Public project')).toBeNull()
  })

  it('is indexable and described by its summary', async () => {
    await renderRoute('/projects/hieu-ui-lab-component-library')
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull()
    expect(document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(
      getShowcaseProject('hieu-ui-lab-component-library')?.summary,
    )
  })
})

describe('Project detail with a live deployment and a screenshot', () => {
  // No shipped project has either yet; these check the paths a future one will use.
  const base = getShowcaseProject('hieu-ui-lab-platform')
  if (!base) throw new Error('Missing project')
  const live: ShowcaseProject = {
    ...base,
    deployment: { status: 'live', url: 'https://demo.example.com/app', verifiedOn: '2026-10-17' },
    media: [
      {
        kind: 'screenshot',
        src: '/showcase/example/home.png',
        alt: 'The home page of the example app',
        caption: 'The home page.',
        width: 1280,
        height: 720,
      },
    ],
  }

  it('links the demo and says when it was checked', () => {
    render(
      <MemoryRouter>
        <ShowcaseDetail project={live} />
      </MemoryRouter>,
    )
    const section = screen.getByRole('region', { name: 'Repository and deployment' })
    const link = within(section).getByRole('link', { name: /demo\.example\.com/ })
    expect(link).toHaveAttribute('href', 'https://demo.example.com/app')
    expect(link).toHaveAttribute('target', '_blank')
    expect(within(section).getByText('Link checked 17 Oct 2026')).toBeInTheDocument()
    expect(within(section).queryByText('Not deployed yet')).toBeNull()
  })

  it('shows the screenshot with its text alternative, size, and caption', () => {
    render(
      <MemoryRouter>
        <ShowcaseDetail project={live} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 2, name: 'Screenshots' })).toBeInTheDocument()
    const image = screen.getByRole('img', { name: 'The home page of the example app' })
    expect(image).toHaveAttribute('src', '/showcase/example/home.png')
    expect(image).toHaveAttribute('width', '1280')
    expect(image).toHaveAttribute('height', '720')
    expect(screen.getByText('The home page.')).toBeInTheDocument()
  })
})

describe('mediaHeading', () => {
  const lab: ShowcaseMedia = { kind: 'lab-demo', slug: 'map-projections', caption: 'c' }
  const shot: ShowcaseMedia = {
    kind: 'screenshot',
    src: '/showcase/a.png',
    alt: 'a',
    caption: 'c',
    width: 1,
    height: 1,
  }
  const link: ShowcaseMedia = {
    kind: 'route-link',
    href: '/components',
    label: 'l',
    description: 'd',
  }

  it('names the section for what it holds', () => {
    expect(mediaHeading([lab, link])).toBe('Live demos')
    expect(mediaHeading([shot, link])).toBe('Screenshots')
    expect(mediaHeading([lab, shot])).toBe('Live demos and screenshots')
    expect(mediaHeading([link])).toBe('Explore it')
  })
})

describe('ShowcaseMediaList', () => {
  it('renders links to the site as a list of related pages', () => {
    render(
      <MemoryRouter>
        <ShowcaseMediaList
          media={[
            {
              kind: 'route-link',
              href: '/components',
              label: 'Components',
              description: 'All of them.',
            },
            { kind: 'template', slug: 'admin-dashboard', caption: 'Built from three blocks.' },
          ]}
        />
      </MemoryRouter>,
    )
    const list = screen.getByRole('list', { name: 'Related pages' })
    expect(within(list).getByRole('link', { name: /Components/ })).toHaveAttribute(
      'href',
      '/components',
    )
    expect(within(list).getByRole('link', { name: /Admin dashboard/ })).toHaveAttribute(
      'href',
      '/templates/admin-dashboard',
    )
  })
})

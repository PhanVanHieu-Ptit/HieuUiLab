import { describe, expect, it } from 'vitest'

import type { Profile, SkillDomain } from './profile-types'
import { findProfileOverclaim, validateProfile, type ProfileContext } from './profile-rules'

const owner = 'https://github.com/example-owner'

const files: Record<string, string> = {
  'src/example.ts': 'export const example = 1 // anchor-text',
}

const ctx: ProfileContext = {
  ownerProfileUrl: owner,
  fileExists: (path) => path in files,
  fileContains: (path, text) => files[path]?.includes(text) ?? false,
  hasPackage: (name) => ['react', 'vitest'].includes(name),
  hasProject: (slug) => slug === 'known-project',
  hasNote: (slug) => slug === 'known-note',
  hasPublicAsset: (path) => path === '/cv.pdf',
}

const domain: SkillDomain = {
  id: 'example-domain',
  title: 'Example domain',
  summary: 'A domain used to test the rules.',
  tools: [{ name: 'React', package: 'react' }, { name: 'SVG' }],
  evidence: [{ label: 'An example', path: 'src/example.ts', anchor: 'anchor-text' }],
  projects: ['known-project'],
  notes: ['known-note'],
}

const valid: Profile = {
  headline: 'Frontend engineer focused on React and TypeScript.',
  intro: ['I build interface code that other people can reuse.'],
  domains: [domain],
  goals: [
    {
      id: 'example-goal',
      title: 'Learn a library',
      why: 'It would widen what the lab can show.',
      today: 'The repository does not use it yet.',
      evidence: { label: 'An example', path: 'src/example.ts', anchor: 'anchor-text' },
      notYetDependency: 'not-installed',
    },
  ],
  links: [
    { kind: 'github', url: owner },
    { kind: 'repository', url: `${owner}/repo` },
    { kind: 'issues', url: `${owner}/repo/issues/new` },
  ],
}

function withDomain(change: Partial<SkillDomain>): Profile {
  return { ...valid, domains: [{ ...domain, ...change }] }
}

function withGoal(change: Partial<Profile['goals'][number]>): Profile {
  const [goal] = valid.goals
  if (!goal) throw new Error('fixture has no goal')
  return { ...valid, goals: [{ ...goal, ...change }] }
}

function problemsOf(profile: Profile): string[] {
  return validateProfile(profile, ctx)
}

describe('validateProfile', () => {
  it('accepts a profile whose evidence exists', () => {
    expect(problemsOf(valid)).toEqual([])
  })

  it('needs a headline, an introduction, and skill domains', () => {
    expect(problemsOf({ ...valid, headline: ' ' })).toContain('profile: needs a headline')
    expect(problemsOf({ ...valid, intro: [] })).toContain('profile: needs an introduction')
    expect(problemsOf({ ...valid, domains: [] })).toContain('profile: needs skill domains')
  })

  describe('skill domains', () => {
    it('reject evidence that does not exist or does not contain its anchor', () => {
      expect(
        problemsOf(
          withDomain({ evidence: [{ label: 'x', path: 'src/missing.ts', anchor: 'anchor-text' }] }),
        ),
      ).toEqual(['domain example-domain: "src/missing.ts" does not exist'])
      expect(
        problemsOf(
          withDomain({ evidence: [{ label: 'x', path: 'src/example.ts', anchor: 'not-there' }] }),
        ),
      ).toEqual(['domain example-domain: "src/example.ts" does not contain "not-there"'])
    })

    it('reject an unsafe evidence path', () => {
      expect(problemsOf(withDomain({ evidence: [{ label: 'x', path: '../outside.ts' }] }))).toEqual(
        ['domain example-domain: "../outside.ts" is not a safe repository-relative path'],
      )
    })

    it('reject projects and notes that do not exist', () => {
      const problems = problemsOf(withDomain({ projects: ['nope'], notes: ['also-nope'] }))
      expect(problems).toContain('domain example-domain: no project or case study "nope"')
      expect(problems).toContain('domain example-domain: no note "also-nope"')
    })

    it('need at least one project or note', () => {
      expect(problemsOf(withDomain({ projects: [], notes: [] }))).toEqual([
        'domain example-domain: needs at least one project or note that shows it',
      ])
    })

    it('reject a tool whose package is not installed, and accept one with no package', () => {
      expect(
        problemsOf(withDomain({ tools: [{ name: 'Left pad', package: 'left-pad' }] })),
      ).toEqual(['domain example-domain: tool "Left pad": "left-pad" is not in package.json'])
      expect(problemsOf(withDomain({ tools: [{ name: 'WebGL2' }] }))).toEqual([])
    })

    it('reject a repeated id, a bad id, and an empty boundary', () => {
      expect(problemsOf({ ...valid, domains: [domain, domain] })).toContain(
        'domain example-domain: id is used twice',
      )
      expect(problemsOf(withDomain({ id: 'Not A Slug' }))).toContain(
        'domain Not A Slug: id must be lowercase words joined by hyphens',
      )
      expect(problemsOf(withDomain({ boundary: ' ' }))).toContain(
        'domain example-domain: boundary is empty; remove it or say what is not shown',
      )
    })
  })

  describe('learning goals', () => {
    it('reject a goal whose package has since been installed', () => {
      expect(problemsOf(withGoal({ notYetDependency: 'react' }))).toEqual([
        'goal example-goal: "react" is now in package.json; rewrite this goal as work that was done, or remove it',
      ])
    })

    it('need evidence that exists and the three texts', () => {
      expect(problemsOf(withGoal({ evidence: { label: 'x', path: 'src/missing.ts' } }))).toEqual([
        'goal example-goal: "src/missing.ts" does not exist',
      ])
      expect(problemsOf(withGoal({ today: '' }))).toContain(
        'goal example-goal: needs a title, a reason, and what the repository has today',
      )
    })
  })

  describe('links', () => {
    it('accept a CV that is a PDF under public/ and a well-formed email', () => {
      const links: Profile['links'] = [
        ...valid.links,
        { kind: 'cv', path: '/cv.pdf' },
        { kind: 'email', address: 'someone@example.com' },
      ]
      expect(problemsOf({ ...valid, links })).toEqual([])
    })

    it('reject a CV that is missing, is not a PDF, or leaves public/', () => {
      expect(problemsOf({ ...valid, links: [{ kind: 'cv', path: '/missing.pdf' }] })).toEqual([
        'link cv: cv "/missing.pdf" is not a file under public/',
      ])
      expect(problemsOf({ ...valid, links: [{ kind: 'cv', path: '/cv.docx' }] })).toEqual([
        'link cv: cv "/cv.docx" must be a .pdf path such as "/cv.pdf"',
      ])
      expect(problemsOf({ ...valid, links: [{ kind: 'cv', path: '/../cv.pdf' }] })).toHaveLength(1)
      expect(
        problemsOf({ ...valid, links: [{ kind: 'cv', path: 'https://example.com/cv.pdf' }] }),
      ).toHaveLength(1)
    })

    it('reject a malformed email', () => {
      for (const address of ['nobody', 'a@b', 'a b@example.com', 'a@example.com?subject=x']) {
        expect(problemsOf({ ...valid, links: [{ kind: 'email', address }] }), address).toHaveLength(
          1,
        )
      }
    })

    it('reject GitHub links under another account', () => {
      const other = 'https://github.com/someone-else'
      expect(problemsOf({ ...valid, links: [{ kind: 'github', url: other }] })).toHaveLength(1)
      expect(
        problemsOf({ ...valid, links: [{ kind: 'repository', url: `${other}/repo` }] }),
      ).toHaveLength(1)
      expect(
        problemsOf({ ...valid, links: [{ kind: 'issues', url: `${other}/repo/issues/new` }] }),
      ).toHaveLength(1)
    })

    it('reject a GitHub link that is not the right kind of page, or not https', () => {
      expect(
        problemsOf({ ...valid, links: [{ kind: 'github', url: `${owner}/repo` }] }),
      ).toHaveLength(1)
      expect(
        problemsOf({ ...valid, links: [{ kind: 'issues', url: `${owner}/repo/pulls` }] }),
      ).toHaveLength(1)
      expect(
        problemsOf({
          ...valid,
          links: [{ kind: 'github', url: 'http://github.com/example-owner' }],
        }),
      ).toHaveLength(1)
    })

    it('reject the same kind twice', () => {
      expect(
        problemsOf({
          ...valid,
          links: [
            { kind: 'github', url: owner },
            { kind: 'github', url: owner },
          ],
        }),
      ).toEqual(['link github: listed twice'])
    })
  })

  describe('wording', () => {
    it('rejects an exaggerated or unsupported claim anywhere in the prose', () => {
      expect(problemsOf({ ...valid, headline: 'An expert in React.' })).toHaveLength(1)
      expect(problemsOf(withDomain({ summary: 'Production-proven components.' }))).toHaveLength(1)
      expect(problemsOf(withGoal({ why: 'Used by customers.' }))).toHaveLength(1)
      expect(problemsOf({ ...valid, intro: ['Cut load time by 40%.'] })).toHaveLength(1)
    })

    it('names the offending text', () => {
      expect(problemsOf({ ...valid, headline: 'An industry-leading engineer.' })).toEqual([
        'profile: contains an exaggerated claim: "An industry-leading engineer."',
      ])
    })
  })
})

describe('findProfileOverclaim', () => {
  it.each([
    ['An expert in React', 'an exaggerated claim'],
    ['Expertise in accessibility', 'an exaggerated claim'],
    ['An industry-leading library', 'an exaggerated claim'],
    ['Production-proven patterns', 'an exaggerated claim'],
    ['A world class design system', 'an exaggerated claim'],
    ['Battle-tested components', 'an exaggerated claim'],
    ['A senior engineer', 'an exaggerated claim'],
    ['Seven years of experience', 'an exaggerated claim'],
    ['5+ years building interfaces', 'an exaggerated claim'],
    ['Graduated in computer science', 'employment or qualification wording'],
    ['Worked at a software company', 'a customer, employer, or production claim'],
    ['I worked for a bank', 'employment or qualification wording'],
    ['A certified developer', 'employment or qualification wording'],
    ['Holds a degree', 'employment or qualification wording'],
    ['Improved speed by 30%', 'a numeric metric'],
    ['Used in production', 'a customer, employer, or production claim'],
    ['See https://example.com', 'a link or email in prose'],
  ])('rejects "%s"', (text, claim) => {
    expect(findProfileOverclaim(text)).toBe(claim)
  })

  it.each([
    'Frontend engineer focused on React, TypeScript, reusable UI systems, and practical engineering.',
    'It makes no claims about employment, qualifications, or how widely anything is used.',
    'Strict compiler settings including exactOptionalPropertyTypes and noUncheckedIndexedAccess.',
    'A lit WebGL2 scene with a small tested matrix module.',
    'The package is private, and the repository has no library build.',
  ])('accepts "%s"', (text) => {
    expect(findProfileOverclaim(text)).toBeUndefined()
  })
})

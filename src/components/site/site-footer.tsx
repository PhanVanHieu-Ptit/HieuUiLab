import { Link } from 'react-router'

import { mainNav, siteConfig } from '@/config/site'
import { contactLinks } from '@/content/profile'
import type { ProfileLinkTarget } from '@/content/profile-types'

import { GitHubIcon, LogoMark } from './icons'
import { ProfileLinkAnchor } from './profile-link'

const linkClass =
  'rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring'

interface FooterLink {
  label: string
  href: string
  target: ProfileLinkTarget
}

interface FooterGroup {
  title: string
  links: readonly FooterLink[]
}

/** A route of this site or a page elsewhere; the anchor picks the router or a new tab from the address. */
function web(label: string, href: string): FooterLink {
  return { label, href, target: 'web' }
}

const groups: readonly FooterGroup[] = [
  {
    title: 'Explore',
    links: mainNav.filter((item) => !item.disabled).map((item) => web(item.title, item.href)),
  },
  {
    title: 'Source',
    links: [
      web('Repository', siteConfig.githubUrl),
      web('Issues', `${siteConfig.githubUrl}/issues`),
    ],
  },
  // The same list the About page shows, so a CV or an email added to the profile appears here too.
  { title: 'Contact', links: contactLinks() },
]

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto grid w-full max-w-page gap-10 px-gutter py-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Link
            to="/"
            className="flex w-fit items-center gap-2 rounded-md font-semibold tracking-tight focus-ring"
          >
            <LogoMark className="size-6" />
            {siteConfig.name}
          </Link>
          <p className="max-w-xs text-sm text-pretty text-muted-foreground">
            A personal frontend engineering lab. Built in the open; source and history are on
            GitHub.
          </p>
          <ProfileLinkAnchor
            link={{ label: 'View on GitHub', href: siteConfig.githubUrl, target: 'web' }}
            className="inline-flex w-fit items-center gap-2 rounded-sm text-sm font-medium focus-ring hover:underline"
          >
            <GitHubIcon className="size-4" />
            View on GitHub
          </ProfileLinkAnchor>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={`Footer: ${group.title}`}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <ProfileLinkAnchor link={link} className={linkClass} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}

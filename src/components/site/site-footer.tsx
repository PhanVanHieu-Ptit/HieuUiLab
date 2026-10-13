import { Link } from 'react-router'

import { mainNav, siteConfig } from '@/config/site'

import { GitHubIcon, LogoMark } from './icons'
import { SmartLink } from './smart-link'

const linkClass =
  'rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-ring'

interface FooterGroup {
  title: string
  links: readonly { label: string; href: string }[]
}

const groups: readonly FooterGroup[] = [
  {
    title: 'Explore',
    links: mainNav
      .filter((item) => !item.disabled)
      .map((item) => ({
        label: item.title,
        href: item.href,
      })),
  },
  {
    title: 'Source',
    links: [
      { label: 'Repository', href: siteConfig.githubUrl },
      { label: 'Issues', href: `${siteConfig.githubUrl}/issues` },
    ],
  },
  {
    title: 'Contact',
    links: [
      { label: 'Open an issue', href: siteConfig.issuesUrl },
      { label: 'GitHub profile', href: siteConfig.githubProfileUrl },
    ],
  },
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
          <SmartLink
            href={siteConfig.githubUrl}
            className="inline-flex w-fit items-center gap-2 rounded-sm text-sm font-medium focus-ring hover:underline"
          >
            <GitHubIcon className="size-4" />
            View on GitHub
          </SmartLink>
        </div>
        {groups.map((group) => (
          <nav key={group.title} aria-label={`Footer: ${group.title}`}>
            <h2 className="text-sm font-semibold">{group.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <SmartLink href={link.href} className={linkClass}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  )
}

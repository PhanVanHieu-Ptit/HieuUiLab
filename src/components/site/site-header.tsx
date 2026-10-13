import { Search } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { mainNav, siteConfig } from '@/config/site'
import { cn } from '@/lib/cn'

import { GitHubIcon, LogoMark } from './icons'
import { MobileNav } from './mobile-nav'
import { ThemeMenu } from './theme-menu'

const isApple = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex h-8 items-center rounded-md px-2.5 text-sm focus-ring transition-colors',
    isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
  )

export function SiteHeader({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <header className="sticky top-0 z-(--z-header) border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-header max-w-page items-center gap-1 px-gutter md:gap-4">
        <MobileNav className="-ml-2 md:hidden" />
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-md font-semibold tracking-tight focus-ring"
        >
          <LogoMark className="size-6" />
          <span>{siteConfig.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 md:flex">
          {mainNav.map((item) =>
            item.disabled ? (
              <span
                key={item.href}
                aria-disabled="true"
                className={cn(navLinkClass({ isActive: false }), 'disabled-state gap-1.5')}
              >
                {item.title}
                {item.label ? <Badge size="sm">{item.label}</Badge> : null}
              </span>
            ) : (
              <NavLink key={item.href} to={item.href} className={navLinkClass}>
                {item.title}
              </NavLink>
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            onClick={onOpenSearch}
            aria-keyshortcuts={isApple ? 'Meta+K' : 'Control+K'}
            className="size-9 px-0 text-muted-foreground lg:h-8 lg:w-56 lg:justify-start lg:px-2.5 xl:w-72"
          >
            <Search aria-hidden="true" />
            <span className="sr-only lg:not-sr-only lg:flex-1 lg:text-left lg:font-normal">
              Search docs
            </span>
            <Kbd aria-hidden="true" className="hidden lg:inline-flex">
              {isApple ? '⌘' : 'Ctrl'} K
            </Kbd>
          </Button>
          <Button asChild variant="ghost" size="icon">
            <a href={siteConfig.githubUrl} target="_blank" rel="noreferrer">
              <GitHubIcon />
              <span className="sr-only">GitHub (opens in a new tab)</span>
            </a>
          </Button>
          <ThemeMenu />
        </div>
      </div>
    </header>
  )
}

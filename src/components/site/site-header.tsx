import { FlaskConical } from 'lucide-react'
import { Link, NavLink } from 'react-router'

import { cn } from '@/lib/cn'

import { ThemeToggle } from './theme-toggle'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-md px-2 py-1 text-sm transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'text-foreground' : 'text-muted-foreground',
  )

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-page items-center gap-6 px-gutter">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <FlaskConical aria-hidden="true" className="size-5 text-primary" />
          Hieu UI Lab
        </Link>
        <nav aria-label="Main" className="flex items-center gap-2">
          <NavLink to="/components" className={navLinkClass}>
            Components
          </NavLink>
        </nav>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

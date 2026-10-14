import { Menu } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { docsNav, labsNav, mainNav, siteConfig, type NavSection } from '@/config/site'

import { DocsNavList } from './docs-nav'
import { LogoMark } from './icons'

// The drawer holds the docs sections, the lab categories, then any header
// destination they do not already cover (e.g. Projects, Notes, About).
const coveredHrefs = new Set(
  [...docsNav, labsNav].flatMap((section) => [
    section.href,
    ...section.items.map((item) => item.href),
  ]),
)
const extraNav = mainNav
  .filter((item) => !coveredHrefs.has(item.href))
  .map((item) => ({ ...item, matchNested: true }))
const drawerSections: readonly NavSection[] = [
  ...docsNav,
  labsNav,
  ...(extraNav.length > 0 ? [{ title: 'More', items: extraNav }] : []),
]

/** Below `md`, the header nav and docs sidebar move into this drawer. */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const close = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open navigation" className={className}>
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle asChild>
            <Link to="/" onClick={close} className="flex items-center gap-2 rounded-md focus-ring">
              <LogoMark className="size-6" />
              {siteConfig.name}
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Site" className="flex-1 overflow-y-auto overscroll-contain p-3">
          <DocsNavList sections={drawerSections} onNavigate={close} />
        </nav>
      </SheetContent>
    </Sheet>
  )
}

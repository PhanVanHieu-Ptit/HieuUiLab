import { useEffect, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'

import { CommandMenu } from './command-menu'
import { NavigationProgress } from './route-fallback'
import { RouteMetadata } from './route-metadata'
import { SiteFooter } from './site-footer'
import { SiteHeader } from './site-header'

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function SiteLayout() {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const modK = event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)
      const slash = event.key === '/' && !isTypingTarget(event.target)
      if (!modK && !slash) return
      event.preventDefault()
      setSearchOpen((open) => (modK ? !open : true))
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <RouteMetadata />
      <NavigationProgress />
      <a
        href="#main"
        className="sr-only z-(--z-popover) rounded-md bg-primary px-3 py-2 text-primary-foreground focus-ring focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader
        onOpenSearch={() => {
          setSearchOpen(true)
        }}
      />
      <Outlet />
      <SiteFooter />
      <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
      <ScrollRestoration />
    </div>
  )
}

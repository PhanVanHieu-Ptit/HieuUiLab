import { NavLink } from 'react-router'

import { cn } from '@/lib/cn'
import { registry } from '@/registry'

export function SiteSidebar() {
  const components = registry.filter((entry) => entry.category === 'component')

  return (
    <nav aria-label="Registry" className="space-y-1 text-sm">
      <h2 className="px-2 pb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Components
      </h2>
      <ul className="space-y-0.5">
        {components.map((entry) => (
          <li key={entry.slug}>
            <NavLink
              to={`/components/${entry.slug}`}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-2 py-1.5 transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {entry.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

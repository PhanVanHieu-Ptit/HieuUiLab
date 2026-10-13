import type { ComponentProps } from 'react'
import { Link } from 'react-router'

type SmartLinkProps = Omit<ComponentProps<'a'>, 'href'> & { href: string }

/**
 * In-app routes ("/…") use the router; anything else opens in a new tab and
 * says so to screen readers.
 */
export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  if (href.startsWith('/')) {
    return (
      <Link to={href} {...props}>
        {children}
      </Link>
    )
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" {...props}>
      {children} <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

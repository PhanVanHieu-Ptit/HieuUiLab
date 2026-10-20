import type { ComponentProps } from 'react'

import type { ResolvedProfileLink } from '@/content/profile-types'

import { SmartLink } from './smart-link'

type ProfileLinkAnchorProps = Omit<ComponentProps<'a'>, 'href'> & {
  link: Pick<ResolvedProfileLink, 'label' | 'href' | 'target'>
}

/**
 * A profile link opened the right way for what it points at. A page on another site opens in a new
 * tab. A file such as the CV is served by this site but is not a route, so it needs a plain anchor
 * (SmartLink would hand "/cv.pdf" to the router). An email address opens the mail client and says
 * nothing about a new tab.
 */
export function ProfileLinkAnchor({ link, children, ...props }: ProfileLinkAnchorProps) {
  const content = children ?? link.label
  switch (link.target) {
    case 'web':
      return (
        <SmartLink href={link.href} {...props}>
          {content}
        </SmartLink>
      )
    case 'file':
      return (
        <a href={link.href} target="_blank" rel="noreferrer" {...props}>
          {content} <span className="sr-only">(opens in a new tab)</span>
        </a>
      )
    case 'mail':
      return (
        <a href={link.href} {...props}>
          {content}
        </a>
      )
  }
}

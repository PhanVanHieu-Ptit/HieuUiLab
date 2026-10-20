import { ArrowUpRight, Mail } from 'lucide-react'

import { ProfileLinkAnchor } from '@/components/site/profile-link'
import { buttonVariants } from '@/components/ui/button'
import type { ResolvedProfileLink } from '@/content/profile-types'

/**
 * The profile's links as buttons. It renders exactly the links it is given, so a CV or an email
 * appears only once the profile lists one that the validator has accepted.
 */
export function ProfileLinkButtons({ links }: { links: readonly ResolvedProfileLink[] }) {
  return (
    <>
      {links.map((link) => (
        <ProfileLinkAnchor
          key={link.kind}
          link={link}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          {link.label}
          {link.target === 'mail' ? (
            <Mail aria-hidden="true" />
          ) : (
            <ArrowUpRight aria-hidden="true" />
          )}
        </ProfileLinkAnchor>
      ))}
    </>
  )
}

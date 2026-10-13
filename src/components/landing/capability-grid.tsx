import { ArrowRight, Boxes, NotebookPen, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from '@/components/ui/card'
import { capabilities } from '@/content/landing'

const icons = [Boxes, ShieldCheck, NotebookPen] as const

export function CapabilityGrid() {
  return (
    <ul className="grid gap-4 md:grid-cols-3">
      {capabilities.map((capability, index) => {
        const Icon = icons[index] ?? Boxes
        return (
          <li key={capability.href} className="flex">
            <Card variant="interactive" className="flex-1">
              <CardHeader className="gap-3">
                <span className="flex size-9 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                  <Icon aria-hidden="true" className="size-4.5" />
                </span>
                <CardTitle>
                  <CardLink asChild>
                    <Link to={capability.href}>{capability.title}</Link>
                  </CardLink>
                </CardTitle>
                <CardDescription>{capability.description}</CardDescription>
              </CardHeader>
              <CardFooter
                aria-hidden="true"
                className="text-sm font-medium text-primary [&_svg]:size-4"
              >
                {capability.linkLabel}
                <ArrowRight />
              </CardFooter>
            </Card>
          </li>
        )
      })}
    </ul>
  )
}

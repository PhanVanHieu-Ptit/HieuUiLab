import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'

import { ComponentPreview } from '@/components/site/component-preview'
import { DemoSlot } from '@/components/site/demo-slot'
import { getExperiment } from '@/content/experiments'
import type { ShowcaseMedia } from '@/content/showcase-types'
import { getTemplate } from '@/content/templates'
import { getImplementedEntry } from '@/registry'

type Live = Extract<ShowcaseMedia, { kind: 'lab-demo' | 'registry-example' }>
type Screenshot = Extract<ShowcaseMedia, { kind: 'screenshot' }>
type Elsewhere = Extract<ShowcaseMedia, { kind: 'route-link' | 'template' }>

function LabDemo({ item }: { item: Extract<ShowcaseMedia, { kind: 'lab-demo' }> }) {
  const experiment = getExperiment(item.slug)
  return (
    <section aria-label={experiment?.title ?? item.slug} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold tracking-tight">{experiment?.title ?? item.slug}</h3>
        <p className="max-w-prose text-sm text-muted-foreground">{item.caption}</p>
      </div>
      <DemoSlot slug={item.slug} />
    </section>
  )
}

function RegistryExample({ item }: { item: Extract<ShowcaseMedia, { kind: 'registry-example' }> }) {
  const entry = getImplementedEntry(item.entry, item.entryKind)
  const example = entry?.examples.find((candidate) => candidate.id === item.example)
  if (!entry || !example) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-prose text-sm text-muted-foreground">
        {item.caption}{' '}
        <Link
          to={`/${item.entryKind === 'block' ? 'blocks' : 'components'}/${entry.slug}`}
          className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-ring"
        >
          Open {entry.name}
        </Link>
      </p>
      <ComponentPreview example={example} />
    </div>
  )
}

function ScreenshotFigure({ item }: { item: Screenshot }) {
  return (
    <figure className="flex flex-col gap-2">
      <img
        src={item.src}
        alt={item.alt}
        width={item.width}
        height={item.height}
        loading="lazy"
        className="h-auto w-full rounded-lg border"
      />
      <figcaption className="text-sm text-muted-foreground">{item.caption}</figcaption>
    </figure>
  )
}

function LinkCard({ item }: { item: Elsewhere }) {
  const link =
    item.kind === 'route-link'
      ? { href: item.href, title: item.label, description: item.description }
      : {
          href: `/templates/${item.slug}`,
          title: getTemplate(item.slug)?.title ?? item.slug,
          description: item.caption,
        }
  return (
    <Link
      to={link.href}
      className="group flex h-full flex-col gap-1 rounded-lg border bg-surface p-4 text-surface-foreground focus-ring hover:border-ring/60"
    >
      <span className="flex items-center justify-between gap-2 font-medium">
        {link.title}
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </span>
      <span className="text-sm text-muted-foreground">{link.description}</span>
    </Link>
  )
}

/** Running examples and screenshots first, then the places on this site worth a look. */
export function ShowcaseMediaList({ media }: { media: readonly ShowcaseMedia[] }) {
  const live = media.filter(
    (item): item is Live => item.kind === 'lab-demo' || item.kind === 'registry-example',
  )
  const shots = media.filter((item): item is Screenshot => item.kind === 'screenshot')
  const links = media.filter(
    (item): item is Elsewhere => item.kind === 'route-link' || item.kind === 'template',
  )

  return (
    <div className="flex flex-col gap-10">
      {live.map((item) =>
        item.kind === 'lab-demo' ? (
          <LabDemo key={`lab-${item.slug}`} item={item} />
        ) : (
          <RegistryExample key={`${item.entry}-${item.example}`} item={item} />
        ),
      )}
      {shots.map((item) => (
        <ScreenshotFigure key={item.src} item={item} />
      ))}
      {links.length > 0 ? (
        <ul aria-label="Related pages" className="grid gap-3 sm:grid-cols-2">
          {links.map((item) => (
            <li key={item.kind === 'route-link' ? item.href : `template-${item.slug}`}>
              <LinkCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

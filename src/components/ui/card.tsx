import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/cn'

const cardVariants = cva('relative flex flex-col rounded-lg border text-surface-foreground', {
  variants: {
    variant: {
      default: 'bg-surface',
      /** Pair with CardLink to make the whole card one large link target. */
      interactive:
        'bg-surface transition-[background-color,border-color] hover:border-ring/50 hover:bg-accent/40 has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-ring',
      dashed: 'border-dashed bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface CardProps extends ComponentProps<'div'>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
}

type HeadingTag = 'h2' | 'h3' | 'h4' | 'p'

export interface CardTitleProps extends ComponentProps<'h3'> {
  /** Heading level that fits the surrounding document outline. */
  as?: HeadingTag
}

export function CardTitle({ as: Tag = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Tag
      className={cn('flex items-center gap-2 leading-snug font-semibold tracking-tight', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('mt-auto flex items-center gap-2 px-5 pb-5', className)} {...props} />
}

export interface CardLinkProps extends ComponentProps<'a'> {
  /** Merge onto a child element, e.g. a router Link. */
  asChild?: boolean
}

/**
 * A link whose hit area stretches over the whole card (the card needs
 * `variant="interactive"`). Focus is drawn on the card, not the text.
 */
export function CardLink({ asChild = false, className, ...props }: CardLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      data-card-link=""
      className={cn(
        'outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[""]',
        className,
      )}
      {...props}
    />
  )
}

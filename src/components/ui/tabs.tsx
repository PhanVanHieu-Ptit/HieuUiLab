import { cva } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'
import { createContext, use, type ComponentProps } from 'react'

import { cn } from '@/lib/cn'

type TabsVariant = 'line' | 'pill'

const TabsVariantContext = createContext<TabsVariant>('line')

const listVariants = cva('flex', {
  variants: {
    variant: {
      line: '[scrollbar-width:none] overflow-x-auto border-b',
      pill: 'inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-md bg-muted p-1',
    },
  },
})

const triggerVariants = cva(
  'disabled-state inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground focus-ring-inset transition-colors hover:text-foreground data-[state=active]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        line: 'relative h-9 px-3 data-[state=active]:after:absolute data-[state=active]:after:inset-x-3 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary',
        pill: 'h-7 rounded-sm px-3 data-[state=active]:bg-background data-[state=active]:shadow-raised',
      },
    },
  },
)

export interface TabsProps extends ComponentProps<typeof TabsPrimitive.Root> {
  /** `line` for page-level sections, `pill` for compact in-panel switches. */
  variant?: TabsVariant
}

export function Tabs({ variant = 'line', className, ...props }: TabsProps) {
  return (
    <TabsVariantContext value={variant}>
      <TabsPrimitive.Root className={cn('flex flex-col gap-3', className)} {...props} />
    </TabsVariantContext>
  )
}

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const variant = use(TabsVariantContext)
  return <TabsPrimitive.List className={cn(listVariants({ variant }), className)} {...props} />
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = use(TabsVariantContext)
  return (
    <TabsPrimitive.Trigger className={cn(triggerVariants({ variant }), className)} {...props} />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('rounded-md focus-ring', className)} {...props} />
}

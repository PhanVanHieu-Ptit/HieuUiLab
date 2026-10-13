import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function TabsLineDemo() {
  return (
    <Tabs defaultValue="overview" className="w-full max-w-md">
      <TabsList aria-label="Project">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings" disabled>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        Three components shipped this week.
      </TabsContent>
      <TabsContent value="activity" className="text-sm text-muted-foreground">
        No new activity.
      </TabsContent>
    </Tabs>
  )
}

export function TabsPillDemo() {
  return (
    <Tabs variant="pill" defaultValue="pnpm" className="w-full max-w-md">
      <TabsList aria-label="Package manager">
        <TabsTrigger value="pnpm">pnpm</TabsTrigger>
        <TabsTrigger value="npm">npm</TabsTrigger>
        <TabsTrigger value="bun">bun</TabsTrigger>
      </TabsList>
      <TabsContent value="pnpm" className="font-mono text-mono">
        pnpm add radix-ui
      </TabsContent>
      <TabsContent value="npm" className="font-mono text-mono">
        npm install radix-ui
      </TabsContent>
      <TabsContent value="bun" className="font-mono text-mono">
        bun add radix-ui
      </TabsContent>
    </Tabs>
  )
}

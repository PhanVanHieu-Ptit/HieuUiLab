import { useState } from 'react'

import { Button } from '@/components/ui/button'
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

export function TabsControlledDemo() {
  const steps = ['account', 'profile', 'review']
  const [step, setStep] = useState('account')
  const index = steps.indexOf(step)

  return (
    <Tabs value={step} onValueChange={setStep} className="w-full max-w-md">
      <TabsList aria-label="Sign-up steps">
        <TabsTrigger value="account">1. Account</TabsTrigger>
        <TabsTrigger value="profile">2. Profile</TabsTrigger>
        <TabsTrigger value="review">3. Review</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="text-sm text-muted-foreground">
        Choose a username and password.
      </TabsContent>
      <TabsContent value="profile" className="text-sm text-muted-foreground">
        Add a display name and avatar.
      </TabsContent>
      <TabsContent value="review" className="text-sm text-muted-foreground">
        Check your details and finish.
      </TabsContent>
      <div className="flex justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={index === 0}
          onClick={() => {
            setStep(steps[index - 1] ?? step)
          }}
        >
          Back
        </Button>
        <Button
          size="sm"
          disabled={index === steps.length - 1}
          onClick={() => {
            setStep(steps[index + 1] ?? step)
          }}
        >
          Next
        </Button>
      </div>
    </Tabs>
  )
}

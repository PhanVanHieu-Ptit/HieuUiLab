import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
} from '@/components/ui/card'

export function CardBasicDemo() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Deploy preview</CardTitle>
        <CardDescription>Build 1842 finished in 38 seconds.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm">All 214 checks passed on the main branch.</CardContent>
      <CardFooter>
        <Button size="sm">Open preview</Button>
        <Button size="sm" variant="ghost">
          View logs
        </Button>
      </CardFooter>
    </Card>
  )
}

export function CardInteractiveDemo() {
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
      <Card variant="interactive">
        <CardHeader>
          <CardTitle className="justify-between">
            <CardLink href="#examples">Tokens</CardLink>
            <Badge size="sm" variant="primary">
              New
            </Badge>
          </CardTitle>
          <CardDescription>The whole card is one link target.</CardDescription>
        </CardHeader>
      </Card>
      <Card variant="dashed">
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>Dashed cards mark placeholders.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

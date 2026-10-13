import { Link } from 'react-router'

import { PageContainer } from '@/components/site/page'
import { Button } from '@/components/ui/button'

export function NotFoundContent() {
  return (
    <div className="py-16 text-center">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-title">Page not found</h1>
      <p className="mt-3 text-muted-foreground">The page you are looking for does not exist.</p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <PageContainer>
      <NotFoundContent />
    </PageContainer>
  )
}

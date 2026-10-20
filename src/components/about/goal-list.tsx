import { proseLinkClass } from '@/components/site/prose'
import { SmartLink } from '@/components/site/smart-link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/config/site'
import type { LearningGoal } from '@/content/profile-types'
import { repositoryFileUrl } from '@/content/showcase-types'

/**
 * Learning goals, set apart from the skills: a "Goal" badge, a dashed card, and a line that says
 * what the repository has today. Nothing here is presented as experience.
 */
export function GoalList({ goals }: { goals: readonly LearningGoal[] }) {
  return (
    <ul aria-label="Learning goals" className="grid gap-4 md:grid-cols-2">
      {goals.map((goal) => (
        <li key={goal.id} className="flex">
          <Card variant="dashed" className="w-full">
            <CardHeader>
              <Badge size="sm" variant="outline" className="w-fit">
                Goal
              </Badge>
              <CardTitle as="h3" className="text-lg">
                {goal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <dl className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">Why</dt>
                  <dd className="text-pretty">{goal.why}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">
                    In this repository today
                  </dt>
                  <dd className="text-pretty">{goal.today}</dd>
                </div>
              </dl>
              <p className="text-muted-foreground">
                Source:{' '}
                <SmartLink
                  href={repositoryFileUrl({ url: siteConfig.githubUrl }, goal.evidence.path)}
                  className={proseLinkClass}
                >
                  {goal.evidence.label}
                </SmartLink>
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}

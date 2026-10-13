import { SmartLink } from '@/components/site/smart-link'
import { techStack } from '@/content/tech-stack'

export function TechStackList() {
  return (
    <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
      {techStack.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <h3 className="font-mono text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.title}
          </h3>
          <ul className="flex flex-col gap-3">
            {group.items.map((item) => (
              <li key={item.name} className="flex flex-col">
                <SmartLink
                  href={item.href}
                  className="w-fit rounded-sm text-sm font-medium focus-ring hover:underline"
                >
                  {item.name}
                </SmartLink>
                <span className="text-sm text-pretty text-muted-foreground">{item.purpose}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

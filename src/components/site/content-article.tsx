import type { ContentSection } from '@/content/types'

import { CodeBlock } from './code-block'
import { SectionHeader } from './page'

function sectionId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Long-form body for notes, case studies, and experiments: anchored h2 sections. */
export function ContentSections({ sections }: { sections: readonly ContentSection[] }) {
  return (
    <div className="flex flex-col gap-12">
      {sections.map((section) => {
        const id = sectionId(section.heading)
        return (
          <section key={id} aria-labelledby={id} className="flex flex-col gap-4">
            <SectionHeader id={id} title={section.heading} anchorLabel={section.heading} />
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="max-w-prose leading-7 text-pretty">
                {paragraph}
              </p>
            ))}
            {section.code ? (
              <CodeBlock
                code={section.code.code}
                language={section.code.language}
                {...(section.code.title ? { title: section.code.title } : {})}
              />
            ) : null}
          </section>
        )
      })}
    </div>
  )
}

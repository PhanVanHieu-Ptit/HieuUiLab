import { Link } from 'react-router'

import { CodeBlock } from '@/components/site/code-block'
import { PageHeader, SectionHeader } from '@/components/site/page'
import { findDocsNavItem } from '@/config/site'
import cnSource from '@/lib/cn.ts?raw'

const inlineCode = 'rounded-sm bg-muted px-1 py-0.5 font-mono text-xs'
const proseLink =
  'rounded-sm font-medium text-primary underline-offset-4 hover:underline focus-ring'

const page = findDocsNavItem('/docs/installation')

const tsconfigPaths = `{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}`

const localSetup = `pnpm install
pnpm dev          # http://localhost:5173`

export function DocsInstallationPage() {
  return (
    <article className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Getting started"
        title={page?.title ?? 'Installation'}
        description={page?.description}
      />

      <section aria-labelledby="requirements" className="flex max-w-prose flex-col gap-4">
        <SectionHeader id="requirements" title="Requirements" anchorLabel="Requirements" />
        <p className="leading-7 text-pretty">
          Entries are written for React 19 with TypeScript and Tailwind CSS v4. There is no package
          to install: you copy each file into your project and own it from then on.
        </p>
      </section>

      <section aria-labelledby="tokens" className="flex flex-col gap-4">
        <SectionHeader
          id="tokens"
          title="1. Add the tokens and state utilities"
          anchorLabel="Add the tokens and state utilities"
          description={
            <>
              Components style themselves only through semantic utilities. Copy the{' '}
              <code className={inlineCode}>:root</code>, <code className={inlineCode}>.dark</code>,
              and <code className={inlineCode}>@theme</code> blocks and the{' '}
              <code className={inlineCode}>@utility</code> rules (
              <code className={inlineCode}>focus-ring</code>,{' '}
              <code className={inlineCode}>focus-ring-inset</code>,{' '}
              <code className={inlineCode}>disabled-state</code>) from this site&apos;s{' '}
              <code className={inlineCode}>src/styles/globals.css</code>. See{' '}
              <Link to="/docs/theming" className={proseLink}>
                Theming
              </Link>{' '}
              for what each token is for.
            </>
          }
        />
      </section>

      <section aria-labelledby="cn" className="flex flex-col gap-4">
        <SectionHeader
          id="cn"
          title="2. Add the cn helper"
          anchorLabel="Add the cn helper"
          description="Every entry merges class names with this helper."
        />
        <CodeBlock code="pnpm add clsx tailwind-merge" language="bash" title="terminal" />
        <CodeBlock code={cnSource} title="src/lib/cn.ts" />
      </section>

      <section aria-labelledby="alias" className="flex flex-col gap-4">
        <SectionHeader
          id="alias"
          title="3. Map the @ import alias"
          anchorLabel="Map the import alias"
          description={
            <>
              Entries import shared code as <code className={inlineCode}>@/lib/cn</code> and{' '}
              <code className={inlineCode}>@/components/ui/…</code>. Point{' '}
              <code className={inlineCode}>@</code> at your source folder in TypeScript and in your
              bundler.
            </>
          }
        />
        <CodeBlock code={tsconfigPaths} language="text" title="tsconfig.json" />
      </section>

      <section aria-labelledby="copy" className="flex max-w-prose flex-col gap-4">
        <SectionHeader id="copy" title="4. Copy an entry" anchorLabel="Copy an entry" />
        <p className="leading-7 text-pretty">
          Open the entry&apos;s page from{' '}
          <Link to="/components" className={proseLink}>
            Components
          </Link>{' '}
          or{' '}
          <Link to="/blocks" className={proseLink}>
            Blocks
          </Link>
          . Its Installation section lists the npm packages to add, the path the file expects, and
          any other registry entries it imports — copy those first. Then paste the source at that
          path.
        </p>
      </section>

      <section aria-labelledby="run-locally" className="flex flex-col gap-4">
        <SectionHeader
          id="run-locally"
          title="Run this site locally"
          anchorLabel="Run this site locally"
          description={
            <>
              Requires Node.js 24+ and pnpm 11 (pinned in{' '}
              <code className={inlineCode}>package.json</code>; run{' '}
              <code className={inlineCode}>corepack enable</code> once to use it).
            </>
          }
        />
        <CodeBlock code={localSetup} language="bash" title="terminal" />
      </section>
    </article>
  )
}

import cnSource from '@/lib/cn.ts?raw'

/**
 * Repository files a page may show with `::source{path="…"}`. Each is imported as text, so the
 * page shows the file as it is, not a copy. Keep this to small files: every one is bundled into
 * the docs chunk that uses it.
 */
export const docSources: Readonly<Record<string, string>> = {
  'src/lib/cn.ts': cnSource,
}

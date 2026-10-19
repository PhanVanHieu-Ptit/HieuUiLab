import { notes } from '@/notes/manifest'
import type { NotesContext } from '@/notes/notes-rules'
import packageJsonSource from '../../package.json?raw'

import { fileContains, fileExists, listFiles, pathExists, readFile } from './repo-files'
import { createRouteChecker } from './showcase-context'

function scriptNames(): Set<string> {
  const parsed = JSON.parse(packageJsonSource) as { scripts?: Record<string, string> }
  return new Set(Object.keys(parsed.scripts ?? {}))
}

/**
 * The real answers for `validateNotes`: every article's Markdown, the repository's files, the
 * router, and the scripts in package.json. Tests only, because it reads every source file as text.
 */
export async function createNotesContext(): Promise<NotesContext> {
  const articles = await Promise.all(
    notes.map(async (entry) => ({ entry, source: (await entry.load()).default })),
  )
  return {
    articles,
    contentFiles: listFiles('src/notes/content/').filter((file) => file.endsWith('.md')),
    readFile,
    fileExists,
    fileContains,
    pathExists,
    routeExists: createRouteChecker(),
    scripts: scriptNames(),
  }
}

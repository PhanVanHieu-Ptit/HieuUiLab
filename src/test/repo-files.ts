import repoFilesSource from './repo-files.ts?raw'

/**
 * Read access to the repository's own files from a test, with no `node:fs` (the app's tsconfig has
 * no node types). Vite resolves these globs at transform time, so only tests may import this
 * module: bundling it into the app would ship every source file as text.
 */
const sources = import.meta.glob<string>(
  [
    '/src/**/*.{ts,tsx,css,svg,md}',
    '/e2e/**/*.ts',
    '/.github/workflows/*.{yml,yaml}',
    '/*.{md,json,ts,js,html}',
  ],
  { query: '?raw', import: 'default', eager: true, exhaustive: true },
)

const publicAssets = import.meta.glob<string>('/public/**/*', {
  query: '?url',
  import: 'default',
  exhaustive: true,
})

// A glob never lists the file that calls it, so this file is added by hand.
const thisFile = '/src/test/repo-files.ts'
const allSources: Record<string, string> = { ...sources, [thisFile]: repoFilesSource }

/** Vite keys are rooted at the project: "src/x.ts" is stored as "/src/x.ts". */
const key = (path: string) => `/${path}`

export function fileExists(path: string): boolean {
  return key(path) in allSources || key(path) in publicAssets
}

/** The text of a repository file, or undefined if it is missing or not a text file Vite reads. */
export function readFile(path: string): string | undefined {
  return allSources[key(path)]
}

/** True for a file, or for a directory that holds at least one. */
export function pathExists(path: string): boolean {
  const prefix = `${key(path)}/`
  return fileExists(path) || Object.keys(allSources).some((file) => file.startsWith(prefix))
}

/** The repository files whose paths start with `prefix`, e.g. "src/docs/content/". */
export function listFiles(prefix: string): string[] {
  return Object.keys(allSources)
    .map((file) => file.slice(1))
    .filter((file) => file.startsWith(prefix))
}

export function fileContains(path: string, text: string): boolean {
  return readFile(path)?.includes(text) ?? false
}

/** A file under `public/`, given its URL path, e.g. "/showcase/app/home.png". */
export function hasPublicAsset(urlPath: string): boolean {
  return `/public${urlPath}` in publicAssets
}

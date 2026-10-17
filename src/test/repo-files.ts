/**
 * Read access to the repository's own files from a test, with no `node:fs` (the app's tsconfig has
 * no node types). Vite resolves these globs at transform time, so only tests may import this
 * module: bundling it into the app would ship every source file as text.
 */
const sources = import.meta.glob<string>(
  [
    '/src/**/*.{ts,tsx,css,svg}',
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

/** Vite keys are rooted at the project: "src/x.ts" is stored as "/src/x.ts". */
const key = (path: string) => `/${path}`

export function fileExists(path: string): boolean {
  return key(path) in sources || key(path) in publicAssets
}

/** The text of a repository file, or undefined if it is missing or not a text file Vite reads. */
export function readFile(path: string): string | undefined {
  return sources[key(path)]
}

export function fileContains(path: string, text: string): boolean {
  return readFile(path)?.includes(text) ?? false
}

/** A file under `public/`, given its URL path, e.g. "/showcase/app/home.png". */
export function hasPublicAsset(urlPath: string): boolean {
  return `/public${urlPath}` in publicAssets
}

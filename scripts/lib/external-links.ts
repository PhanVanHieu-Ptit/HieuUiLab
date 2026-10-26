/*
 * What scripts/check-external-links.ts needs that does not touch the network: finding the web
 * addresses the repository ships, deciding which are worth asking for, and reading the answer.
 * The pieces are separate so a test can show each one.
 *
 * Only erasable TypeScript, so Node runs it directly.
 */

/** Hosts that stand for no real site: documentation examples, the local machine, XML namespaces. */
const PLACEHOLDER_HOST =
  /(?:^|\.)(?:example\.(?:com|org|net)|localhost|invalid|test)$|^127\.|^\[::1\]$/i
const NAMESPACE_HOST = new Set(['www.w3.org', 'openapi.vercel.sh', 'json-schema.org'])

/** Every http(s) address in a text, without the punctuation that ends a sentence or a link. */
export function extractUrls(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s)"'`<>\]\\]+/g) ?? []
  return found.map((url) => url.replace(/[.,;:!?*]+$/, ''))
}

/**
 * Whether a web address is one to ask for. A placeholder in a docs example, a template with `{key}`
 * or `<owner>` in it, a schema or namespace address, and the address of a page the repository
 * itself builds are not links a reader follows to another site.
 */
export function isCheckable(url: string): boolean {
  if (/[{}<>$]/.test(url)) return false
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  return !PLACEHOLDER_HOST.test(parsed.hostname) && !NAMESPACE_HOST.has(parsed.hostname)
}

/** The address without its `#fragment`, which a request cannot test. */
export function withoutFragment(url: string): string {
  return url.split('#')[0] ?? url
}

export type Verdict = 'ok' | 'broken' | 'unverified'

/**
 * What an answer says. A page that is gone (404, 410) is broken. A refusal (401, 403, 429) or a
 * server error says nothing about the page: GitHub and others rate-limit or block scripts, so
 * those are left to a person to open.
 */
export function classifyStatus(status: number): Verdict {
  if (status >= 200 && status < 400) return 'ok'
  if (status === 404 || status === 410) return 'broken'
  return 'unverified'
}

function textProperty(value: unknown, key: string): string {
  if (typeof value !== 'object' || value === null) return ''
  const property = (value as Record<string, unknown>)[key]
  return typeof property === 'string' ? property : ''
}

/** Errors that mean the address cannot work at all, as opposed to a slow or unreachable network. */
export function classifyError(cause: unknown): { verdict: Verdict; reason: string } {
  // fetch wraps the system error (ENOTFOUND, a certificate error) as the `cause` of a TypeError.
  const code = textProperty(cause instanceof Error ? cause.cause : undefined, 'code')
  if (code === 'ENOTFOUND' || code.includes('CERT')) return { verdict: 'broken', reason: code }
  const reason = code === '' ? textProperty(cause, 'name') : code
  return { verdict: 'unverified', reason: reason === '' ? 'request failed' : reason }
}

/** Plain `http://` addresses are never right for a link on an https site. */
export function isInsecure(url: string): boolean {
  return url.startsWith('http://')
}

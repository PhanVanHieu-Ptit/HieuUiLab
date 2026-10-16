/** Example only, not a backend. Resolves after a short wait so pending states can be seen. */
export function mockDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

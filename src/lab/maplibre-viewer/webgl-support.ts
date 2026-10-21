let cached: boolean | undefined

function probe(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    if (!gl) return false
    // Release the probe's context at once: browsers cap the number of live WebGL contexts.
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

/**
 * Whether this browser can create a WebGL2 context, which MapLibre GL JS 6 requires. Checked
 * before the library is imported, so a browser that cannot run the map never downloads it. The
 * answer is remembered for the page's lifetime.
 */
export function supportsWebgl2(): boolean {
  cached ??= probe()
  return cached
}

/** Forget the remembered answer. Only tests need this. */
export function resetWebgl2Probe(): void {
  cached = undefined
}

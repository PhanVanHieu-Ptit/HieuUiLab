/**
 * Whether this page can write to the clipboard. Browsers expose the API only in
 * secure contexts, so a copy button is hidden rather than shown and broken.
 */
export function canWriteClipboard(): boolean {
  if (typeof navigator === 'undefined') return false
  const clipboard = navigator.clipboard as Clipboard | undefined
  return typeof clipboard?.writeText === 'function'
}

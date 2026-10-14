import type { PropDoc } from './types'

/** Returns a function that extracts one exported demo function from a demos file. */
export function demoExtractor(demosSource: string) {
  return (name: string): string => {
    const start = demosSource.indexOf(`export function ${name}`)
    if (start === -1) return demosSource
    const next = demosSource.indexOf('\nexport function ', start + 1)
    return demosSource.slice(start, next === -1 ? undefined : next).trim()
  }
}

/** Props shared by every component that spreads native attributes onto an element. */
export function nativeProps(element: string): PropDoc {
  return {
    name: '...props',
    type: `ComponentProps<'${element}'>`,
    description: 'All native attributes, including ref (React 19).',
  }
}

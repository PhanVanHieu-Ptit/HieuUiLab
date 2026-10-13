import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { mockMatchMedia, prefersReducedMotion } from '@/test/media'

import { useReducedMotion } from './use-reduced-motion'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useReducedMotion', () => {
  it('is false when the user has not asked for reduced motion', () => {
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('follows the preference live', () => {
    const change = mockMatchMedia(prefersReducedMotion)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)

    act(() => {
      change(() => false)
    })
    expect(result.current).toBe(false)
  })
})

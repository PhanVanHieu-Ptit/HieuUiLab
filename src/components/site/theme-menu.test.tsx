import { act, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { THEME_STORAGE_KEY, useTheme } from '@/hooks/use-theme'

import { ThemeMenu } from './theme-menu'

async function choose(name: 'Light' | 'Dark' | 'System') {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /^Theme:/ }))
  await user.click(await screen.findByRole('menuitemradio', { name }))
}

describe('ThemeMenu', () => {
  beforeEach(() => {
    // The theme store is module-level; reset it so tests stay independent.
    const { result, unmount } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('system')
    })
    unmount()
    localStorage.clear()
  })

  it('offers light, dark, and system with the current choice checked', async () => {
    const user = userEvent.setup()
    render(<ThemeMenu />)
    await user.click(screen.getByRole('button', { name: /^Theme:/ }))

    const items = await screen.findAllByRole('menuitemradio')
    expect(items.map((item) => item.textContent)).toEqual(['Light', 'Dark', 'System'])
    expect(screen.getByRole('menuitemradio', { name: 'System' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('applies and persists the dark theme on the document', async () => {
    render(<ThemeMenu />)
    await choose('Dark')

    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeInTheDocument()
  })

  it('resolves system to the OS preference (light in jsdom)', async () => {
    render(<ThemeMenu />)
    await choose('Dark')
    await choose('System')

    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('is operable with the keyboard alone', async () => {
    const user = userEvent.setup()
    render(<ThemeMenu />)
    await user.tab()
    expect(screen.getByRole('button', { name: /^Theme:/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    await screen.findByRole('menu')
    // Opening with the keyboard focuses the first item (Light); one step down is Dark.
    await user.keyboard('{ArrowDown}{Enter}')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toHaveFocus()
  })
})

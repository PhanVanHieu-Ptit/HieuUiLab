import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { CodeBlock } from './code-block'

describe('CodeBlock', () => {
  it('shows the code at once and highlights it once the grammar has loaded', async () => {
    const { container } = render(<CodeBlock code="const a = 1" language="tsx" title="a.tsx" />)
    expect(container.querySelector('pre')).toHaveTextContent('const a = 1')
    await waitFor(() => {
      expect(container.querySelector('.shiki')).not.toBeNull()
    })
    expect(container.querySelector('.shiki')).toHaveTextContent('const a = 1')
  })

  it.each(['ts', 'json', 'css'] as const)('highlights %s', async (language) => {
    const { container } = render(<CodeBlock code="a" language={language} />)
    await waitFor(() => {
      expect(container.querySelector('.shiki')).not.toBeNull()
    })
  })

  it.each(['bash', 'text'] as const)('does not highlight %s', async (language) => {
    const { container } = render(<CodeBlock code="pnpm add clsx" language={language} />)
    // Give a highlighter that wrongly started a chance to finish.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(container.querySelector('.shiki')).toBeNull()
    expect(container.querySelector('pre')).toHaveTextContent('pnpm add clsx')
  })

  it('names the file in the header and uses it for the copy button when asked', () => {
    // userEvent.setup() installs the clipboard stub; the copy button only mounts where one exists.
    userEvent.setup()
    render(
      <CodeBlock code="x" language="text" title="src/lib/cn.ts" copyLabel="Copy src/lib/cn.ts" />,
    )
    expect(screen.getByText('src/lib/cn.ts')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy src/lib/cn.ts' })).toBeInTheDocument()
  })

  it('falls back to the language as the header and "Copy code" as the button name', () => {
    userEvent.setup()
    render(<CodeBlock code="x" language="bash" />)
    expect(screen.getByText('bash')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy code' })).toBeInTheDocument()
  })

  it('copies the code exactly and announces it', async () => {
    // Created before rendering: the copy button checks for the clipboard when it mounts.
    const user = userEvent.setup()
    const code = 'pnpm add clsx\npnpm add tailwind-merge'
    render(<CodeBlock code={code} language="bash" />)
    await user.click(screen.getByRole('button', { name: 'Copy code' }))
    expect(await navigator.clipboard.readText()).toBe(code)
    expect(screen.getByText('Copied to clipboard')).toBeInTheDocument()
  })

  it('shows the code without a copy button where the clipboard API is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true })
    try {
      render(<CodeBlock code="pnpm add clsx" language="bash" />)
      expect(screen.queryByRole('button', { name: /^Copy / })).toBeNull()
      expect(screen.getByText('pnpm add clsx')).toBeInTheDocument()
    } finally {
      if (original) Object.defineProperty(navigator, 'clipboard', original)
      else Reflect.deleteProperty(navigator, 'clipboard')
    }
  })

  it('ignores a highlight result that arrives after the code changed', async () => {
    const { container, rerender } = render(<CodeBlock code="const first = 1" language="tsx" />)
    rerender(<CodeBlock code="const second = 2" language="tsx" />)
    await waitFor(() => {
      expect(container.querySelector('.shiki')).not.toBeNull()
    })
    expect(container.querySelector('.shiki')).toHaveTextContent('const second = 2')
    expect(container).not.toHaveTextContent('const first = 1')
  })
})

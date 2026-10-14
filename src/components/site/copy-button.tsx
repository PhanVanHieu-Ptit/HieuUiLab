import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { canWriteClipboard } from '@/lib/clipboard'
import { cn } from '@/lib/cn'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

/** Copies `value` exactly. Renders nothing where the clipboard API is unavailable. */
export function CopyButton({ value, label = 'Copy code', className }: CopyButtonProps) {
  const [supported] = useState(canWriteClipboard)
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  useEffect(() => {
    if (status === 'idle') return
    const timeout = window.setTimeout(() => {
      setStatus('idle')
    }, 2000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setStatus('copied')
    } catch {
      setStatus('error')
    }
  }

  if (!supported) return null

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={label}
        className={cn('size-8', className)}
        onClick={() => void copy()}
      >
        {status === 'copied' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      </Button>
      <span role="status" className="sr-only">
        {status === 'copied' ? 'Copied to clipboard' : status === 'error' ? 'Copy failed' : ''}
      </span>
    </>
  )
}

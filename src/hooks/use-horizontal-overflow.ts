import { useEffect, useRef, useState } from 'react'

/** True while the element is wider inside than out, i.e. it scrolls sideways. */
export function useHorizontalOverflow<E extends HTMLElement>() {
  const ref = useRef<E>(null)
  const [overflowing, setOverflowing] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const update = () => {
      setOverflowing(node.scrollWidth > node.clientWidth + 1)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => {
      observer.disconnect()
    }
  }, [])
  return [ref, overflowing] as const
}

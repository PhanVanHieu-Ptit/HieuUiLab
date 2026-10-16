/** Width of a preview frame; `full` fills the available width. */
export type PreviewViewport = 'full' | 'tablet' | 'mobile'

export const previewViewports: readonly {
  value: PreviewViewport
  label: string
  width?: number
}[] = [
  { value: 'full', label: 'Full' },
  { value: 'tablet', label: 'Tablet', width: 768 },
  { value: 'mobile', label: 'Mobile', width: 375 },
]

// Written out in full so Tailwind can see them.
export const viewportWidthClass: Record<PreviewViewport, string> = {
  full: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
}

/** Options for a `SegmentedControl`: "Tablet 768px", "Mobile 375px". */
export const previewViewportOptions = previewViewports.map(({ value, label, width }) => ({
  value,
  label: width === undefined ? label : `${label} ${String(width)}px`,
}))

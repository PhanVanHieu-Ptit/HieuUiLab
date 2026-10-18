// What each token is for. The tokens themselves (names and values) are read from globals.css by
// `parseDesignTokens`; `token-docs.test.ts` fails when a token is added or removed there without
// this file following, so the generated tokens page never has an undescribed row.

/** Usage of each design token, keyed by its CSS variable name without the dashes. */
export const tokenDocs: Readonly<Record<string, string>> = {
  // Color
  background: 'Page canvas',
  foreground: 'Body text',
  surface: 'Cards, previews, tables',
  'surface-foreground': 'Text on surface',
  popover: 'Menus, dialogs, drawer',
  'popover-foreground': 'Text on popover',
  muted: 'Subtle fills, inline code',
  'muted-foreground': 'Secondary text',
  accent: 'Hover and highlighted rows',
  'accent-foreground': 'Text on accent',
  primary: 'The one accent: primary actions, links',
  'primary-foreground': 'Text on primary',
  'primary-subtle': 'Active navigation, selection',
  'primary-subtle-foreground': 'Text on primary-subtle',
  secondary: 'Secondary buttons',
  'secondary-foreground': 'Text on secondary',
  destructive: 'Errors, irreversible actions',
  'destructive-foreground': 'Text on destructive',
  success: 'Stable, positive status',
  'success-foreground': 'Text on success',
  warning: 'Experimental, caution',
  'warning-foreground': 'Text on warning',
  info: 'Neutral notices',
  'info-foreground': 'Text on info',
  border: 'Dividers and outlines',
  input: 'Form control borders',
  ring: 'Focus outline',
  overlay: 'Backdrop behind dialogs and sheets',
  code: 'Code panels',
  'code-foreground': 'Text on code panels',

  // Radius
  radius: 'Base corner radius; the scale below derives from it',
  'radius-sm': 'Small corners (rounded-sm)',
  'radius-md': 'Default corners (rounded-md)',
  'radius-lg': 'Large corners (rounded-lg)',
  'radius-xl': 'Extra large corners (rounded-xl)',

  // Elevation
  'elevation-raised': 'Small lift for raised controls such as the active tab (shadow-raised)',
  'elevation-floating': 'Dialogs, sheets, select menus, tooltips (shadow-floating)',

  // Stacking
  'z-header': 'Sticky site header',
  'z-overlay': 'Dialog and sheet backdrops and panels',
  'z-popover': 'Tooltips and menus, above dialogs and sheets',

  // Typography
  'font-sans': 'Interface text',
  'font-mono': 'Code',
  'text-display': 'Display type size',
  'text-title': 'Title type size',
  'text-heading': 'Heading type size',
  'text-mono': 'Monospace type size',

  // Layout
  'spacing-gutter': 'Horizontal page padding (px-gutter)',
  'spacing-section': 'Vertical space between page sections (py-section)',
  'spacing-header': 'Sticky header height (h-header, top-header)',
  'spacing-sidebar': 'Docs sidebar width (w-sidebar)',
  'container-page': 'Widest page container (max-w-page)',
  'container-content': 'Content page container (max-w-content)',
  'container-prose': 'Reading-width container for prose',
  'container-sheet': 'Side sheet width (max-w-sheet)',

  // Motion
  'animate-fade-in': 'Overlays and tooltips appearing',
  'animate-fade-out': 'Overlays and tooltips leaving',
  'animate-pop-in': 'Dialogs, select menus, and tooltips appearing (scale and fade)',
  'animate-pop-out': 'Dialogs, select menus, and the theme menu leaving',
  'animate-slide-in-left': 'Sheet opening from the left',
  'animate-slide-out-left': 'Sheet closing to the left',
  'animate-slide-in-right': 'Sheet opening from the right',
  'animate-slide-out-right': 'Sheet closing to the right',
}

/** Usage of each `@utility` rule in globals.css. */
export const utilityDocs: Readonly<Record<string, string>> = {
  'focus-ring':
    '2px outline in the ring color on :focus-visible, drawn outside the element. An outline, so it survives forced-colors mode.',
  'focus-ring-inset':
    'The same outline drawn inside the element, for items in scroll containers where an outside outline would be clipped.',
  'disabled-state':
    'Dims to 50% and blocks pointer input for :disabled, [aria-disabled="true"], and [data-disabled].',
}

/**
 * Samples for the typography group. The class names are written out in full so Tailwind generates
 * them; building them from the token names would leave the sample unstyled.
 */
export const typographySamples = [
  { className: 'text-display', label: 'text-display', sample: 'Display' },
  { className: 'text-title', label: 'text-title', sample: 'Title' },
  { className: 'text-heading', label: 'text-heading', sample: 'Heading' },
  { className: 'text-base', label: 'text-base', sample: 'Body text' },
  {
    className: 'text-sm text-muted-foreground',
    label: 'text-sm text-muted-foreground',
    sample: 'Secondary text',
  },
  { className: 'font-mono text-mono', label: 'text-mono', sample: 'const code = true' },
] as const

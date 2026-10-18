# Accessibility guidelines

This page describes what the lab does for accessibility, how that is checked, and what is not checked. It lists behavior that exists in the code and tests; each entry's own page adds guidelines for that component. [Component conventions](/docs/component-conventions) covers how components are written.

## What is checked automatically {#checks}

- **Lint.** `pnpm lint` runs the `eslint-plugin-jsx-a11y` recommended rules and fails on any warning. A rule is switched off only in a few places, each with a comment that says why.
- **Contrast.** `src/styles/tokens.test.ts` checks WCAG AA contrast in the light and dark themes: 4.5:1 for every text and background pair, and 3:1 for the focus ring against each surface. If you change a color and the test fails, adjust the lightness until it passes. See [Theme customization](/docs/theming#change).
- **Component tests.** They find elements by role and accessible name, as assistive technology does, and operate them with the keyboard (Tab, Enter, Space, and the arrow keys).
- **End-to-end tests.** Playwright drives a real browser through keyboard flows: opening and choosing in Select, Tooltip appearing on focus, the Dialog focus trap, the skip link, sorting and paging a data table, and saving forms. A separate test runs with `prefers-reduced-motion` set.

## Patterns the components follow {#patterns}

- **Native elements first.** A button is a `<button>`, a table is a `<table>`, and a control with a label has a real `<label>`. [Data table](/blocks/data-table) keeps native table semantics, with `aria-sort` on the sorted header, instead of becoming an ARIA grid. Select, Dialog, Tabs, and Tooltip build on Radix primitives, which supply roles and keyboard behavior.
- **Names and descriptions.** [Field](/components/field) generates ids and connects a control to its label, helper text, and error with `aria-describedby`, `aria-invalid`, and `aria-required`. Icon-only buttons carry an `aria-label`. An [Alert](/components/alert) has a title that names the status in words, so color is never the only signal.
- **Focus you can see.** The shared `focus-ring` utilities draw an outline on `:focus-visible`, so focus stays visible in forced-colors mode. Components never remove an outline without replacing it.
- **Disabled and busy.** `disabled-state` covers `:disabled`, `[aria-disabled="true"]`, and `[data-disabled]`. A loading button is disabled and has `aria-busy`.
- **Announcements.** An Alert is `role="status"` (announced politely) by default and `role="alert"` for the destructive variant. [Form feedback](/components/form-feedback) uses `status` for success and `alert` for an error. A loading data table announces that it is loading, and the copy button says "Copied to clipboard".
- **Focus after a change.** When the thing a user was using disappears, focus goes somewhere sensible:
  - Form feedback takes focus when it appears, and `useFormSubmit` focuses the first invalid or server-rejected field. See [Form integration](/docs/form-integration#submit).
  - [Detail panel](/blocks/detail-panel) moves focus to its heading when it opens and returns it to the control that opened it.
  - The [CRUD management page](/blocks/crud-management-page) moves focus to its heading after a delete, since the row and its button are gone.
  - [Multi-step onboarding](/blocks/multi-step-onboarding) focuses the heading of each new step.
  - [Notification center](/blocks/notification-center) moves focus to the next notification after an action, and the [Search and filter toolbar](/blocks/search-filter-toolbar) moves it to a neighboring chip when one is removed.
- **Scrolling regions.** A table, code block, or props table that is wider or taller than its space becomes a focusable, named region only while it overflows, so a keyboard user can scroll it and no tab stop is added otherwise.
- **Reduced motion.** A `prefers-reduced-motion` rule in `src/styles/globals.css` collapses animation and transition durations. The WebGL lab also stops its animation, through the `useReducedMotion` hook, and shows a fallback state.
- **Landmarks and headings.** The site has a "Skip to content" link to the single `<main>` element, and every page has exactly one `h1`; a route test checks both.

## Adding to this list {#checklist}

When you write or change a component, check that:

1. a native element does the job, or a Radix primitive supplies the roles and keyboard behavior;
2. every control has an accessible name, from a visible label through Field, or from `aria-label` for an icon-only button;
3. it uses `focus-ring` or `focus-ring-inset`, and its colors come from token pairs the contrast test already covers. A new text pair belongs in the list in `src/styles/tokens.test.ts`;
4. a test finds it by role and name and operates it with the keyboard;
5. the JSDoc and the entry's `guidelines` state the ARIA behavior and any caveat for the person using it.

## What is not covered {#limits}

- No automated accessibility engine, such as axe, runs in this repository. Lint checks static JSX only, and the contrast test checks the token pairs, not arbitrary content placed on them.
- Screen reader behavior is not tested beyond the roles, names, and states that the tests assert.
- A combobox with an editable text field is not implemented: the registry's Combobox entry is planned, and Select is the available choice control.

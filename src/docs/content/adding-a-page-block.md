# Adding a page block

Page blocks are registry blocks in the Pages category: dashboards, settings, sign-in, and wizards, assembled from existing components and listed under [Blocks](/blocks). They are added the same way as any other entry, plus the rules below. Read [Block composition](/docs/block-composition) first for the reasons behind them.

## Steps {#steps}

1. Follow [Adding a component](/docs/component-conventions/adding-a-component) for the files and the registration, with `kind: 'block'` and `category: 'pages'`.
2. Write **one flat file** in `src/components/blocks/<slug>.tsx`. It may import only `@/components/ui/*`, `@/components/blocks/*`, `@/lib/cn`, and the packages in `src/registry/packages.ts`. Compose existing components and keep small helpers in the same file. `registryDependencies` must list exactly what the file imports.
3. **Reflow with the container, not the window.** Put `@container` on a wrapper root and use `@lg:` or `@[52rem]:` variants, so the block responds to the preview width switcher. A block that composes [Data toolbar](/blocks/data-toolbar) or [Profile form](/blocks/profile-form) gets its layout from them.
4. **Type the props**, document their defaults, model the state as a union (`loading`, `error`, `ready`), and take the clock as a prop rather than reading it.
5. **Keep mock data out of the block**, in `src/registry/<slug>/mock-data.ts`, with a header saying it is invented. Name handlers `mock*`; they wait briefly and never authenticate, bill, or call a backend.
6. **Fill in the metadata.** Give every example `preview: { layout: 'fill', height: 'lg', responsive: true }` and a description that says the data is an example or invented. Document the main part's every prop with a type and a description. Write at least four `guidelines` and at least one `installation.notes`, and list `cn-helper` and `design-tokens` among the `requirements`.
7. **Test it.** Add a unit test next to the block for its states, validation, keyboard, and focus. Add a flow in `e2e/blocks.spec.ts`, and add the route to the `routes` array in `e2e/shell.spec.ts` so the overflow sweep covers it.

## What the tests reject {#rules}

`src/registry/page-blocks.test.ts` checks every Pages block against the steps above, and its demos too. A block's source and its demos must not do anything listed in `forbiddenInSource` in `src/test/source-rules.ts`, which is the source of truth for the list. It covers sizing from the viewport (`min-h-screen`, `h-screen`, `dvh`), `fixed` positioning, `dark:` variants, `matchMedia`, reading the clock, network requests, browser storage, a router, and raw palette colors such as `bg-blue-600`. Avoid Sheet too, since it positions itself against the window.

The same file checks that there are at least two examples, each in the resizable preview, that example descriptions say the data is invented or an example, and that the mock-data file says so too. When a rule fails, the test names the block and the rule.

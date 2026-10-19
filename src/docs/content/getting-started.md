# Getting started

Hieu UI Lab is a personal registry of React components and page-level blocks, with the tests, examples, and engineering notes behind them. This page explains how the registry works and where each topic is documented.

## How the registry works

Each registry entry is a single component file plus a page with live examples, the full source, the npm packages it needs, and a props reference. There is no package to install: you copy the file into your project and adapt it. [Installation](/docs/installation) lists what a copied entry expects from your project.

Components style themselves only through semantic tokens such as `bg-surface` and shared state utilities such as `focus-ring`, so they follow your theme. [Design tokens](/docs/design-tokens) lists every token, and [Theme customization](/docs/theming) covers changing them.

## Where to start

- To use a component, open it from [Components](/components) or [Blocks](/blocks), then follow [Installation](/docs/installation).
- To try a component's props without writing code, use the [Playground](/playground).
- To see blocks combined into whole screens, open the [Templates](/templates).
- To read how this site is built, start with [Project structure](/docs/project-structure).

## Run the site locally

The site needs Node.js 24 or newer and pnpm 11. The version of pnpm is pinned in `package.json`; run `corepack enable` once to use it.

```bash title="install and start"
pnpm install
pnpm dev
```

`pnpm dev` serves the site at `http://localhost:5173`. Before you push, `pnpm check` runs the lint, format, type, unit test, and build steps; CI runs the same steps, then the end-to-end tests with `pnpm test:e2e`. [Testing strategy](/docs/testing) explains each one.

## What is documented where

- Foundations: [Design tokens](/docs/design-tokens), [Theme customization](/docs/theming), and [Accessibility guidelines](/docs/accessibility).
- Guides: [Component conventions](/docs/component-conventions), [Form integration](/docs/form-integration), [DataTable usage](/docs/data-table), and [Block composition](/docs/block-composition).
- Reference: [Component API reference](/docs/component-api).
- Project: [Testing strategy](/docs/testing), [Troubleshooting](/docs/troubleshooting), and the [Changelog](/docs/changelog).

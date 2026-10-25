# Registry validation as a distribution workflow

## Context and problem

This lab distributes components by copy. A reader opens an entry's page, copies one file into their own project, and owns it from then on. To make that copy work they also need to know which npm packages it imports, which other entries it depends on, and what project setup it expects, such as the `cn` helper and the design tokens.

That information is a contract, and a contract written by hand drifts. A component can start importing a new package without the install steps being updated, and then a reader's copy fails to compile with no hint about why. With a package manager the dependency list is part of the package. With copy-and-own there is no package, so something else has to keep the install steps true.

The question is how a single author, with no release process, keeps the install contract honest.

## Constraints

When this note was written, the installation page stated the setup plainly: there was no package to install, no command-line tool, and no registry file to download, and nothing tracks a copied file against the entry it came from. The last part is still true. Whatever the workflow is, it works inside the site and its tests.

Each entry is one flat file, so the contract is small: packages, other entries, setup requirements, and a target path. The metadata is typed data, the project compiles with strict settings, and the entry's source has to be the file that actually runs, so that what a reader copies is what the site's own pages render. The checks have to run in development, where an author is editing, and in CI, where nobody is.

## Approach and alternatives considered

1. **Show the real file.** An entry's `source` is its component file imported as raw text, so the Source tab cannot differ from the code. The alternative, pasting the code into documentation, drifts at the first edit, and the docs checks reject pasted registry code.
2. **Declare the install steps, then check them against the source.** The metadata lists the packages, the entries it depends on, and the requirements. A validator parses the source's imports and compares in both directions: an import that is not declared fails, and so does a declaration that the source does not use. The alternative is to infer everything from the source and declare nothing. Declaring costs a second place to edit. It also makes the contract explicit data, which the page can render, and the check turns any disagreement into a failure instead of a surprise.
3. **A closed vocabulary.** The packages an entry may name are a fixed record, as are the setup requirements, with a test that each package is a dependency of this project at the version range the page shows.
4. **Resolve the plan, do not hand-write it.** The packages and entries a reader needs are computed by following dependencies transitively, dependencies first, so the install command on the page is generated.
5. **Fail loudly where the author is.** The registry validates itself when its module loads in development, and the same validation is a test.
6. **Pin the public URLs.** A test holds the list of every entry URL as a snapshot.

A well-known alternative is a registry of JSON files that a command-line tool installs from. The schema page of one such registry describes an item with `dependencies` for npm packages, `registryDependencies` for other items, and `files`. Those map onto what this repository keeps as `installation.packages`, `installation.registryDependencies`, and the entry's source and target path. Serving them as JSON and installing them with a tool was not built when this note was written, and that was a boundary of this workflow, not an omission by accident. It has since been built for one entry, Kbd, as described under the trade-offs below.

## Implementation example

An entry declares its install contract in its metadata file. Its source and examples are in a second file beside it, loaded only where they are shown, so the metadata stays small enough for the navigation to read. This is the whole contract for `Button`.

```ts title="src/registry/button/meta.ts (the install contract)"
  installation: {
    targetPath: 'components/ui/button.tsx',
    packages: ['class-variance-authority', 'radix-ui', 'lucide-react'],
    registryDependencies: [],
    requirements: ['cn-helper', 'design-tokens', 'state-utilities'],
  },
```

The validator compares the declared packages with the imports it finds, in both directions.

```ts title="src/registry/validate.ts (declared packages against the source)"
const imports = parseSourceImports(source)
for (const name of imports.packages) {
  if (!(installation.packages as readonly string[]).includes(name)) {
    report('installation.packages', `source imports "${name}" but it is not declared`)
  }
}
for (const name of installation.packages) {
  if (!imports.packages.has(name)) {
    report('installation.packages', `declares "${name}" but the source does not import it`)
  }
}
```

Package names are limited to a closed record, and the type of a package name comes from its keys.

```ts title="src/registry/packages.ts (a closed vocabulary)"
} as const satisfies Record<string, { purpose: string }>

export type PackageName = keyof typeof registryPackages
```

The install plan follows registry dependencies and puts each one before the entry that needs it.

```ts title="src/registry/install.ts (dependencies first)"
function visit(current: ImplementedEntry) {
  for (const slug of current.installation.registryDependencies) {
    if (seen.has(slug)) continue
    seen.add(slug)
    const dependency = lookup(slug)
    if (!dependency || !isImplemented(dependency)) continue
    visit(dependency)
    ordered.push(dependency)
  }
}
visit(entry)
```

The page turns the plan into a command a reader can copy.

```tsx title="src/pages/registry-detail-page.tsx (the generated command)"
<CodeBlock
  code={`pnpm add ${plan.packages.join(' ')}`}
  language="bash"
  title="terminal"
  copyLabel="Copy install command"
/>
```

The registry is a hand-written array, and it validates itself while developing.

```ts title="src/registry/index.ts (failing loudly while developing)"
// Fail loudly while developing; tests run the same validation in CI.
if (import.meta.env.DEV) assertValidRegistry(registry)
```

A snapshot test holds the public URLs steady, and says in a comment what a rename needs.

```ts title="src/registry/registry.test.tsx (stable URLs)"
  // Slugs are public URLs. Renaming one breaks links, so it must be a deliberate
  // change here, together with a redirect from the old URL.
  it('stay stable', () => {
```

For comparison, here is what the same contract could look like as a JSON item, using the property names from the schema page cited below. It is a sketch and is not built.

```json title="Hypothetical example: the Button contract as a JSON registry item (not built in this repository)"
{
  "name": "button",
  "dependencies": ["class-variance-authority", "radix-ui", "lucide-react"],
  "registryDependencies": [],
  "files": [{ "path": "components/ui/button.tsx" }]
}
```

## Verification

The validator has its own tests, which feed it bad data for each rule and also assert that the real registry is clean. Other tests check that every entry has a working page, that the URL snapshot holds, that the packages the registry names are dependencies of this project at the version ranges the page shows, and that an install plan resolves transitively, with dependencies first.

```bash title="Command: run the registry validation and install tests"
pnpm test src/registry/validate.test.ts src/registry/registry.test.tsx
```

The validator was also tried against the real data. While writing this note, `lucide-react` was removed from the packages that Button's metadata declares, and the validator tests were run. They did not report a failed assertion. They failed before any test ran, because importing the registry triggers the development assertion, and the error named the exact drift: `button › installation.packages: source imports "lucide-react" but it is not declared`. The metadata was then restored and the tests passed.

A second throwaway check looked at what the import parser reads. Static imports, side-effect imports, and `export … from` statements were found. A dynamic `import()` and a `require()` call were not.

### What this does not verify

At the time of writing, no test copied an entry into a fresh project and built it; since the update described under the trade-offs below, one does, for Kbd alone, and no other entry has been installed that way. The validator proves that the declared contract matches the imports in the file, not that the file compiles elsewhere, that the tokens a reader copies are enough, or that the listed packages work together at other versions. The generated install command names packages without versions, and only the dependencies table shows the ranges. Because the parser misses dynamic imports and `require`, a package loaded that way would not be checked. The development assertion is skipped in a production build, because `import.meta.env.DEV` is false there, which is acceptable only because CI runs the same validation as a test. No test compares the folders under the registry with the array, so a new entry that is not added to the array would simply not appear; the only globs there read demo and mock-data files for the page-level blocks. The comment on the URL snapshot says that a rename needs a redirect from the old URL, but the code has no per-entry redirect table, only a redirect for an entry requested under the wrong kind.

## Trade-offs and lessons learned

Declaring the contract and then checking it duplicates information on purpose. The cost is an extra edit when an import changes. The benefit is that drift becomes a failure at the moment of the edit, in the author's terminal, instead of a broken copy in a reader's project. It works only as far as the parser can see, and the dynamic-import gap shows where that ends.

Showing the real file through a raw import is the decision with the highest return. It removes a whole class of drift for free, and the documentation checks reinforce it by rejecting pasted copies of registry code.

A hand-written array keeps the registry explicit and reviewable, and its order drives navigation. The price is that registering an entry is a manual step with no safety net.

The deliberate absence of a command-line tool, a JSON export, and a versioning story kept the system small enough to understand. It also means that a reader who copies a file today has no way to learn that the entry changed tomorrow, which the installation page says directly.

Update, 2026-10-22: the question left open here, whether a registry of JSON items with a tool would close that gap, was tried for one entry. Kbd is now generated into a shadcn registry item from the same entry and source file, checked for drift by `pnpm registry:check`, and installed into a fresh project by `pnpm registry:install-test`. It did not close the gap. The tool can show the difference between an installed file and the current item with its `--diff` option, and it kept a file that had been edited unless `--overwrite` was given. Nothing records which version of the item a file came from, so nothing tells a reader that the item changed. Running the real tool also found two mistakes in the first draft of the generator that the unit tests could not have found. A throwaway conflict run, kept out of the repository, showed that a dependency on the tool's built-in `utils` item would let `--overwrite` replace a reader's own `lib/utils.ts`, so the item depends on the `cn` package instead. The install test's comparison with the official build showed that the generated files listed their keys in a different order. The page [Install with the shadcn CLI](/docs/shadcn-registry) lists what was run and what was not.

The general lesson is that copy-and-own does not remove the need for a dependency contract. It moves the contract from a package manifest into metadata, and then the metadata needs the same kind of enforcement a manifest gets for free.

## References

- The shadcn/ui [registry introduction](https://ui.shadcn.com/docs/registry), opened while writing this note: it describes a registry as a distribution system for code that a command-line tool can run.
- The same project's [registry item schema](https://ui.shadcn.com/docs/registry/registry-item-json), opened while writing this note: it names `dependencies` for npm packages, `registryDependencies` for other registry items, and `files`, where each file has a `path`, a `type`, and an optional `target`.

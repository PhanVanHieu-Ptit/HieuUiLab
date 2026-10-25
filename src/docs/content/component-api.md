# Component API reference

Every implemented entry documents its API as typed metadata, and the registry renders that metadata on the entry's page. This page explains how to read it, and lists every entry with the parts it exports. The lists below are generated from the metadata, so they cannot drift from the entries.

## Where an entry's API lives {#where}

Each entry has a page with these sections: Examples, Code (a Usage tab with the generated import line and the entry's guidelines, and a Source tab with the file), Installation, Dependencies, an API reference, and Related entries. For example, [Button](/components/button#api) shows its props at `#api`.

The API reference has one table per exported part: a component, a hook, a helper function, or a type. Many parts end with a row for the native attributes of the element they render. That row includes `ref`, which is an ordinary prop in React 19.

## Reading a props table {#reading}

- **Prop** is the name, **Type** is the TypeScript type as the metadata documents it, and **Description** says what it does.
- **Default** is the default value when the metadata documents one, and a dash when it does not.
- A prop shown as `a / b` is two props documented together.

## What is guaranteed {#guarantees}

The registry validator checks the metadata when the dev server starts, each entry's source and examples when its page loads in development, and all of it in the unit tests:

- every documented part is a real export of the entry's source, since the Usage tab's import line is built from the part names;
- every prop has a type and a description, and a prop cannot be both required and have a default;
- the playground controls refer to documented props, and their options and defaults match the documentation.

The validator does not compare a documented type with the TypeScript type in the source. Where the two ever differ, the source is right. [Adding a component](/docs/component-conventions/adding-a-component) lists the full set of checks.

## Components {#components}

::registry-index{kind="component"}

## Blocks {#blocks}

::registry-index{kind="block"}

## Related guides {#guides}

[Form integration](/docs/form-integration) and [DataTable usage](/docs/data-table) show how several entries work together, with their API tables embedded from the same metadata.

# Whole-card links without nesting everything in an anchor

## Context and problem

The notes, projects, templates, and experiments on this site are shown as cards, and a visitor should be able to click anywhere on a card to open it. The obvious way to do that is to wrap the whole card in an anchor. It has two costs that matter for accessibility.

An anchor's accessible name is built from everything inside it, so a card wrapped in a link is announced by a screen reader as a long string made of its date, its title, its summary, and its tags. And an anchor cannot contain another link or button, a rule MDN states in the permitted content of the `<a>` element, so a card that is one big link can never hold a second control. The problem is to make the whole card clickable while keeping the link's name short and leaving room for other controls later.

## Constraints

The link has to be a real link, with a real `href`, so that middle-click, "open in new tab", and the context menu all work. It has to work with the router's `Link` component, so that navigation stays inside the application. The card's heading level has to be configurable, because the same card appears under an `h2` on one page and an `h3` on another. Keyboard focus has to be visible and has to match the clickable area, which is the whole card, not just the title text.

The solution should also be a property of the card component and not a trick repeated at every call site, because the site has several kinds of card.

## Approach and alternatives considered

Three approaches were considered.

1. **Wrap the card in an anchor.** Simple, but it gives the long accessible name and forbids nested controls.
2. **Add a click handler to the card that navigates.** The title can stay a short link, but the card itself is not a link: there is no `href` to open in a new tab, and a click handler on a container is invisible to assistive technology.
3. **Keep the link on the title and stretch its hit area with a pseudo-element.** The link is only the title, so its name is the title. An `::after` element positioned over the whole card makes a click anywhere on the card land on the link.

The third approach was chosen. The card is `position: relative`, the link's pseudo-element is positioned with `inset: 0`, and the link itself is drawn with no outline of its own. The focus ring is drawn on the card instead, through a `:has()` selector that matches when the link inside it has keyboard focus, so the ring surrounds the area that a click would activate.

## Implementation example

`CardLink` is the link part. With `asChild` it merges its props onto a single child, which is how the router's `Link` is used. The marker attribute is what the card's focus style looks for.

```tsx title="src/components/ui/card.tsx (the stretched link)"
export function CardLink({ asChild = false, className, ...props }: CardLinkProps) {
  const Comp = asChild ? Slot.Root : 'a'
  return (
    <Comp
      data-card-link=""
      className={cn(
        'outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[""]',
        className,
      )}
      {...props}
    />
  )
}
```

The card side is a variant. All cards are `relative`, which gives the pseudo-element its box, and the `interactive` variant adds the focus ring that appears when the link inside has keyboard focus.

```ts title="src/components/ui/card.tsx (the interactive variant)"
const cardVariants = cva('relative flex flex-col rounded-lg border text-surface-foreground', {
// …
      interactive:
        'bg-surface transition-[background-color,border-color] hover:border-ring/50 hover:bg-accent/40 has-[[data-card-link]:focus-visible]:outline-2 has-[[data-card-link]:focus-visible]:outline-offset-2 has-[[data-card-link]:focus-visible]:outline-ring',
```

At a call site the link sits inside the card's title, so the heading level and the link are independent.

```tsx title="src/components/site/content-cards.tsx (a card using the link)"
<CardTitle as={headingLevel} className="text-lg">
  <CardLink asChild>
    <Link to={`/projects/${project.slug}`}>{project.title}</Link>
  </CardLink>
</CardTitle>
```

## Verification

Two unit tests in `src/components/ui/card.test.tsx` cover the component: the link carries the marker attribute inside an interactive card, and `asChild` merges the attribute onto a child element. The accessible name is checked indirectly. The notes page test looks the link up by its role and the exact title text, which only matches if the link's name is the title and nothing else.

```bash title="Command: run the card and page tests"
pnpm test src/components/ui/card.test.tsx src/pages/section-pages.test.tsx
```

The hit area is the main claim and no test in the suite exercises it, because jsdom has no layout. It was checked once in Chromium with a throwaway end-to-end test that was deleted afterwards: on the templates page it took the bottom-right corner of the first card, confirmed that the point lay outside the title link's box, clicked it, and observed the navigation to that card's page.

### What this does not verify

The throwaway check covered one card on one page in one browser at one viewport width. The suite itself does not test the pseudo-element, the stacking order, or the focus ring, and support for the `:has()` selector in other browsers was not examined. Nothing was tested with a screen reader, so the claim about a short announced name rests on a link taking its name from its content, plus the role-and-name lookup above, not on listening to one. Only the nesting rule was checked against a source, the MDN page below; the rules for computing an accessible name were not read. Text selection by dragging across a card was not examined, although an overlay over the card content is expected to affect it.

## Trade-offs and lessons learned

The pseudo-element covers the whole card, so any other button or link inside the card sits underneath it and would not receive clicks. It would have to be positioned and given a stacking order above the overlay. This is a constraint on future cards, not a current problem: in `content-cards.tsx` and `capability-grid.tsx` the cards hold the title link and static content, apart from whatever a caller passes to the preview slot of the experiment card, which was not examined.

The focus style depends on a marker attribute and on `:has()`, which ties the card variant and the link together by an attribute name. That coupling is deliberate, because the card has to know whether a link inside it is focused, and the comments on the variant and on `CardLink` say the two go together. Even so, a rename on one side would silently remove the ring, and no test would notice.

The takeaway is that "make the whole card clickable" and "keep the link name short" are compatible once the link is the title and the card does the rest. Pushing the behavior into the card component means each new kind of card gets it by using two components, and does not need to remember a pattern.

## References

- MDN's reference page for the [`<a>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/a), opened while writing this note: its technical summary says no descendant of an anchor may be interactive content or another anchor.

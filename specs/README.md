# Specs

> A focused planning surface so you (the developer) and an AI assistant
> can have a structured conversation about what to build next, in what
> order, and how. Each spec is scoped to one body of work, surfaces the
> open design decisions, and ends with a concrete acceptance checklist.

## Why this folder exists

`GAME-ROADMAP.md` lists *what* is left to do at a high level.
`Knowledge-Gaps.md` lists *what isn't decided*. Neither tells you *what
to do next* or *how to start*. The specs in this folder bridge that
gap: each one is small enough to start work from, structured around the
decisions that block implementation, and tagged with dependencies so
you can pick the right one to pull next.

## Quick links

- **First time here?** Read [`00-how-to-use-specs.md`](./00-how-to-use-specs.md).
- **Back for another session?** Skip to the **Recommended order** table below.

## How to use a spec (the conversation loop)

Every spec follows the same shape:

1. **Goal & one-line summary** — what success looks like.
2. **Why now / dependencies** — what this unblocks; what blocks it.
3. **Current state** — what already exists in the code.
4. **Open questions to answer** — numbered, with `> Your answer:`
   placeholders. Answer in-place. The AI will read your answers as
   authoritative when it implements.
5. **Proposed approach** — the AI's recommended default if you don't
   override, broken into discrete commits.
6. **Acceptance checklist** — what "done" means.
7. **Out of scope** — explicitly deferred items.

### The conversation loop

```
1. Pick a spec from the recommended order below.
2. Read it end-to-end; skim sections (1)-(3).
3. Answer the questions in section (4) inline. Short answers are fine
   ("yes / no / option B"); add a note when you have a strong opinion.
4. Tell the AI: "Spec NN is ready, please implement."
5. The AI will:
   a. Re-read the spec.
   b. Confirm it has every answer it needs (asks if any are still TBD).
   c. Open a branch and work through the commits in section (5).
   d. Update section (6) as it goes; tick the boxes as commits land.
6. When the checklist is fully ticked, mark the spec [DONE] in this file
   and update the roadmap.
```

If a spec turns out to be too big once you start, say so — the AI will
split it into a follow-up spec rather than ploughing on.

## Recommended order

The order below is historical and remains useful for dependency shape.
**Spec 01 is already done** and the Jest/hermetic-e2e harness is live;
new runtime specs must use it rather than treating tests as blocked.

| # | Spec | Why this order |
|---|------|----------------|
| 1 | [`01-test-harness-setup.md`](./01-test-harness-setup.md) | **[DONE]** Installed `jest-expo` + `@testing-library/react-native`, wrote the first hermetic e2e test, and became the reference. |
| 2 | [`02-engine-store-integration.md`](./02-engine-store-integration.md) | Replaces hard-coded `useState` mocks with `createGameStore` from `axiomancer-mechanics`. Foundation for every screen. |
| 3 | [`03-presenter-layer.md`](./03-presenter-layer.md) | Defines `<screen>.engine.ts` presenter contract: `(state) => ViewModel`. Locks in the testable boundary. |
| 4 | [`04-combat-screen-wiring.md`](./04-combat-screen-wiring.md) | **[DONE]** First real screen wired through the presenter. The most complex screen — getting it right de-risks the rest. |
| 5 | [`05-character-screen-wiring.md`](./05-character-screen-wiring.md) | Reads engine character data; informs the equipment slot story. |
| 6 | [`06-inventory-screen-wiring.md`](./06-inventory-screen-wiring.md) | **[DONE]** Reads engine items; introduces `useConsumable` flows. |
| 7 | [`07-exploration-screen-wiring.md`](./07-exploration-screen-wiring.md) | Reads engine `WorldState`; node graph rendering. |
| 8 | [`08-event-screen-wiring.md`](./08-event-screen-wiring.md) | Engine Spec 08 (world) is done; this screen waits on Spec 09 store/orchestration + a pinned narrative contract (see spec body). |
| 9 | [`09-asyncstorage-persistence.md`](./09-asyncstorage-persistence.md) | Adds an `AsyncStorage` adapter so the game survives app restarts. Coordinates with engine Spec 12. |
| 10 | [`10-navigation-and-app-shell.md`](./10-navigation-and-app-shell.md) | Polish on routing: deep links, back behaviour, tab badges. |
| 11 | [`11-asset-pipeline.md`](./11-asset-pipeline.md) | Replaces SVG placeholders per `SVG_ASSET_SPEC.md`. |
| 12 | [`12-accessibility-and-theming.md`](./12-accessibility-and-theming.md) | A11y labels, reduce-motion, font-scaling, large-text support. |

## Conventions

- A spec is a *living document*. As you answer questions, edit the spec
  in-place. Treat it as the canonical source-of-truth for that body of
  work.
- One spec, one branch, one PR — unless a spec explicitly chunks itself
  into commits that land separately.
- When a spec is fully implemented, append `> [DONE on YYYY-MM-DD — see PR #N]`
  at the top and link the PR.
- Don't be afraid to write `> Your answer: defer — implement default and
  revisit.` That's a valid answer too.

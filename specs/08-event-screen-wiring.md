# Spec 08 — Event Screen Wiring

## Goal

Replace `app/(tabs)/event.tsx`'s hard-coded encounter / boss
illustrations and choice rows with engine-driven event data via
`selectEventViewModel`. Picking a choice dispatches through the
engine's quest / event reducer.

**Success state:** When the player enters an event node, the engine's
`activeEvent` is non-null; the screen renders its prompt and choices;
each choice calls `actions.resolveEvent(choiceId)`.

## Why now / dependencies

- **Unblocks:** the broader quest / story flow (mostly engine work).
- **Depends on:** Spec 01, 02, 03, 07. Heavy dependency on engine
  Spec 08 (world content + hazards) and Spec 09 (game loop
  orchestration).

## Current state

- `app/(tabs)/event.tsx` ships with a literal encounter scene + boss
  scene (procedural SVG illustrations described in
  [`SVG_ASSET_SPEC.md`](../SVG_ASSET_SPEC.md) sections 7a / 7b).
- The engine has `World/quest libraries` per the README, but the
  event-resolution loop (`resolveEvent`, `eventChoices`) is largely
  TBD pending engine Spec 08 / 09.

## Open questions

1. **What an "event" is.** The mock conflates "boss encounter" with
   "story choice node". Define:
   - (A) **(default)** Two distinct VM kinds: `combat-prelude` (foe
     intro before combat starts) and `narrative-choice` (text + 2-4
     choices).
   - (B) One unified `Event` with optional combat hand-off.
   > Your answer:

2. **Choice consequences.** Each choice has stat cost, item gain,
   stance lock, etc. Should the VM:
   - (A) **(default)** Expose machine-readable consequences (`{ kind:
     'damage', amount: 3 }[]`) so the screen can preview them.
   - (B) Only the human-readable description; the engine resolves on
     pick.
   - (C) Both.
   > Your answer:

3. **Illustrations.** Mock has a procedural "Encounter" and a
   procedural "Boss" SVG. Real assets per `SVG_ASSET_SPEC.md`
   sections 7a / 7b. Use:
   - (A) **(default)** Engine event includes an `art: string` slug;
     mobile maps slug → asset.
   - (B) Mobile owns the slug-to-asset map locally.
   > Your answer:

4. **Resolving an event mid-combat.** Some events (a tempting voice
   inside a boss fight) might dispatch *during* combat. In scope or
   future spec?
   > Your answer:

5. **Skip animation.** Reading large text blocks on mobile is slow.
   Add a "skip" button?
   > Your answer:

## Proposed approach

1. **Move `event.tsx` into a folder** — `app/(tabs)/event/index.tsx`
   plus `event.engine.ts`, `e2e/event.engine.test.ts`.
2. **Implement `selectEventViewModel`** consuming `state.session.activeEvent`.
3. **Action layer** — `eventActions.pickChoice(choiceId)`,
   `eventActions.dismiss`.
4. **Refactor the screen.**
5. **Hermetic e2e**:
   - Happy path: a fixture event → render → pick choice → state
     updates.
   - No active event → screen shows empty / "no event in progress".
   - Lifecycle: a node-enter dispatch sets `activeEvent`; presenter
     reflects it.

## Acceptance checklist

- [ ] All 5 questions answered.
- [ ] `app/(tabs)/event/` folder exists.
- [ ] Procedural illustrations remain *as placeholders* but their
      slugs come from the engine event.
- [ ] Hermetic e2e green.
- [ ] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Real assets — Spec 11.
- Engine event content — engine Spec 08.
- In-combat events — flagged in Q4 for a later spec.

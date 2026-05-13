# Phase 6 — Spec 08: Event screen wiring

> **Status: [SKIPPED — blocked on engine Spec 09 + narrative contract].** This
> phase cannot ship autonomously. The autonomous loop logged
> this brief on its first attempt, marked the build-plan row
> `[skipped]`, and routed to Phase 7. See `plan/AUDIT.md`'s
> `[needs-user-call]` row for the resolution path.

## Blocker

`specs/08-event-screen-wiring.md`'s **illustrative** success
state names a slice that does not exist on `GameState` today:

```
state.session.activeEvent   // not on GameState — do not use
actions.resolveEvent(choiceId)
event.choices: EventChoice[]
```

The installed package (`axiomancer-mechanics ^0.4.1`) **does**
export the Spec 08 **world** layer (`moveToNode`, `processNode`,
`applyDialogueChoice`, `DialogueTree`, `MapEvent`, … — see
mechanics `docs/world.md`), but **`createGameStore` does not**
expose movement / node processing / dialogue as actions, and
there is still no first-class “pending map event with choice
IDs” model. The **narrow** gap for Phase 6 is: **orchestration +
pinned mobile contract** (engine Spec 09) **and** answered
product questions in the mobile spec.

The mobile spec previously quoted “TBD pending engine Spec 08 /
09”; **Spec 08 is done** — the remaining dependency is **Spec 09**
(and possibly a small follow-up if the product wants
`MapEvent`-level choices beyond NPC dialogue).

In addition, all five of Spec 08's open questions are
**unanswered** in the spec file. Even if the engine APIs
existed, the autonomous loop would have to invent answers
about:

1. The VM kind split (`combat-prelude` vs. `narrative-choice`,
   or one unified shape).
2. Whether the VM exposes machine-readable consequences or
   only descriptions.
3. Where the slug-to-asset map lives.
4. Whether mid-combat events are in scope.
5. Whether to ship a "skip" button on long text.

These are product calls, not implementation calls.

## Paths forward (for the user)

1. **Ship engine Spec 09** (or bump `axiomancer-mechanics` once
   it contains that work): `createGameStore` must expose the
   exploration / node / narrative actions the Event tab needs,
   **or** document an official pure-function workflow the mobile
   app composes. Un-skip Phase 6 by flipping `[skipped]` → `[ ]`
   once the contract is pinned **and** the five open questions
   in `specs/08-event-screen-wiring.md` are answered; the next
   `/march` tick then ships the phase autonomously.
2. **Defer Spec 08 indefinitely** — leave `[skipped]`. The
   product flow still works for combat / character /
   inventory / exploration; Spec 08 is the quest-narrative
   layer.
3. **Stub-ship** — wire `selectEventViewModel` against a
   purely local `useState` event fixture, with no engine
   integration, and call it Spec 08-lite. The autonomous loop
   chose **not** to take this path: it would create a fake
   that has to be torn down when the real engine lands, and
   the open questions still need product answers.

## What this brief does ship

Nothing in code. The deliverable for this autonomous tick is
documentation:

- This brief (`plan/phases/phase_6_event_screen_wiring.md`).
- A `[needs-user-call]` row in `plan/AUDIT.md`.
- Phase 6's row in `plan/steps/01_build_plan.md` flipped
  `[ ]` → `[skipped]` with the blocker quoted on the row, so
  `ship-a-phase`'s "first `[ ]`" scan skips past it.
- A Phase log entry noting the skip + reason.

## Verify gate

```bash
npm run verify
```

No code touched → verify state unchanged → 185 / 185.

## Deploy gate

Unchanged. Exit 0 (stub).

## DoD (for this skip-tick, not for the real Spec 08 ship)

1. Brief committed at this file path.
2. `plan/AUDIT.md` carries a `[needs-user-call]` row pointing
   here.
3. `plan/steps/01_build_plan.md` Phase 6 row flipped to
   `[skipped]` with the blocker reason on-row.
4. Phase log entry: `phase 6 — SKIPPED — engine Spec 09 +
   narrative contract pending; see
   plan/phases/phase_6_event_screen_wiring.md`.

## When Phase 6 *actually* ships

The brief above will be **rewritten by the user (or the next
autonomous tick after engine Spec 09 + contract land)** as a real shipping
brief that mirrors Phases 4 / 5's shape — open-question
answers, files-shipped table, decisions-made-upfront, DoD that
flips `[skipped]` → `[x]`, etc. Treat this version as a
placeholder.

## Follow-ups (out of scope this skip-tick)

- Engine Spec 09 / package tracking. When orchestration + the
  pinned narrative contract land, add a ready-to-action item
  if the mobile repo still needs a version bump.
- The five open product questions in Spec 08 are independent
  of the engine bump and can be answered any time — answering
  them early de-risks the eventual ship.

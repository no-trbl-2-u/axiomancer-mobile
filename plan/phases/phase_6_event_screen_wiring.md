# Phase 6 — Spec 08: Event screen wiring

> **Status: [SKIPPED — blocked on engine event APIs].** This
> phase cannot ship autonomously. The autonomous loop logged
> this brief on its first attempt, marked the build-plan row
> `[skipped]`, and routed to Phase 7. See `plan/AUDIT.md`'s
> `[needs-user-call]` row for the resolution path.

## Blocker

`specs/08-event-screen-wiring.md`'s success state requires:

```
state.session.activeEvent   // engine surface
actions.resolveEvent(choiceId)
event.choices: EventChoice[]
```

The currently installed engine package
(`axiomancer-mechanics ^0.4.1`) does **not** export any of
these. The full event-related surface in
`node_modules/axiomancer-mechanics/dist/index.d.ts` is:

- Types: `MapEvent`, `MapEventType`, `UniqueEvent` (data
  shapes only).
- Reducer: `completeUniqueEvent(state, eventId)` — fires when
  a unique event resolves; takes no choice argument and no
  choice consequence.
- No `activeEvent` slice on `GameState`.
- No `resolveEvent` reducer.
- No `EventChoice` / `eventChoices` type or accessor.

Spec 08's own "Current state" section flags this:
> "the event-resolution loop (`resolveEvent`, `eventChoices`)
> is largely TBD pending engine Spec 08 / 09."

So the dependency is acknowledged in the spec itself; the
engine work simply hasn't landed yet.

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

1. **Bump `axiomancer-mechanics`** to a version that exposes
   `activeEvent` + `resolveEvent` + `eventChoices`. Once
   landed, the user (or `/oversight`) un-skips Phase 6 by
   flipping `[skipped]` → `[ ]` and answers the five open
   questions in `specs/08-event-screen-wiring.md`. The next
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
4. Phase log entry: `phase 6 — SKIPPED — engine event APIs
   missing; see plan/phases/phase_6_event_screen_wiring.md`.

## When Phase 6 *actually* ships

The brief above will be **rewritten by the user (or the next
autonomous tick after the engine bump)** as a real shipping
brief that mirrors Phases 4 / 5's shape — open-question
answers, files-shipped table, decisions-made-upfront, DoD that
flips `[skipped]` → `[x]`, etc. Treat this version as a
placeholder.

## Follow-ups (out of scope this skip-tick)

- Engine package bump tracking. When the engine maintainer
  ships event-resolution APIs, the user adds it to AUDIT as a
  ready-to-action item.
- The five open product questions in Spec 08 are independent
  of the engine bump and can be answered any time — answering
  them early de-risks the eventual ship.

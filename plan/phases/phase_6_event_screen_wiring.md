# Phase 6 — Spec 08: Event screen wiring

> **Status: [SKIPPED — blocked on five open product questions].** The
> engine half of the blocker cleared in
> `axiomancer-mechanics@0.6.0`; the remaining gate is product
> calls in `specs/08-event-screen-wiring.md`. The autonomous loop
> still cannot ship this autonomously and routes to the next
> phase. See `plan/AUDIT.md`'s `[needs-user-call]` row for the
> resolution path.

## Blocker

`specs/08-event-screen-wiring.md`'s **illustrative** success
state names a slice that does not exist on `GameState` today:

```
state.session.activeEvent   // not on GameState — do not use
actions.resolveEvent(choiceId)
event.choices: EventChoice[]
```

As of `axiomancer-mechanics@0.6.0`, the engine-side gap is
closed: `createGameStore` exposes `moveToNode(nodeId)`,
`processNode()`, and `applyDialogue(tree, choice)` on
`GameActions` (see
`node_modules/axiomancer-mechanics/dist/Game/store.d.ts`), and
the public surface includes `ProcessNodeResult` /
`ProcessedEvent` / `MapEvent` / `UniqueEvent` /
`completeUniqueEvent` / `DialogueTree` /
`applyDialogueChoice`. The mobile presenter has to **compose**
`activeEvent` / `EventChoice[]` from `ProcessNodeResult` and
the current dialogue node — there is still no first-class
"pending map event with choice IDs" slice, by design — but
the engine no longer blocks the wiring.

The remaining blocker is product: all five of Spec 08's open
questions are **unanswered** in the spec file. The autonomous
loop would have to invent answers about:

1. The VM kind split (`combat-prelude` vs. `narrative-choice`,
   or one unified shape).
2. Whether the VM exposes machine-readable consequences or
   only descriptions.
3. Where the slug-to-asset map lives.
4. Whether mid-combat events are in scope.
5. Whether to ship a "skip" button on long text.

These are product calls, not implementation calls.

## Paths forward (for the user)

1. **Answer the five open questions** in
   `specs/08-event-screen-wiring.md` (the engine half is now
   present in `axiomancer-mechanics@0.6.0`: `moveToNode`,
   `processNode`, and `applyDialogue` are on `GameActions`).
   Un-skip Phase 6 by flipping `[skipped]` → `[ ]` once the
   product questions are pinned; the next `/march` tick then
   ships the phase autonomously.
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

- The five open product questions in Spec 08 can be answered
  any time — answering them is now the *only* gate left to
  unblock this phase.
- ~~Engine Spec 09 / package tracking~~ — **closed
  2026-05-15.** `axiomancer-mechanics@0.6.0` ships
  `moveToNode` / `processNode` / `applyDialogue` on
  `GameActions`; verified by 260/260 hermetic tests passing
  on the mobile side after the bump.

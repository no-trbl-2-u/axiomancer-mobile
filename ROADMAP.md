# ROADMAP — aligning Axiomancer Mobile with `axiomancer-mechanics`

> Authored 2026-05-15 after auditing the phase plans in
> `axiomancer-mobile/plan/steps/01_build_plan.md` against
> `axiomancer-mechanics/plan/steps/01_build_plan.md`.
> The mobile loop has shipped 1–15 (16 `[skipped]`). The engine
> loop has shipped 09–26 since the mobile substrate was built;
> phase 27 is the engine's next-up. Several engine phases
> introduced public-surface changes (skills lib, MapEvents,
> typed events, presets) that the mobile client has not yet
> adopted. This roadmap names every divergence and orders the
> work to close them.

---

## 1. Audit summary — what diverged

A side-by-side of *new* engine surface that mobile does not yet
consume. The mobile-side citations are the still-live mock /
stub / TODO sites.

| # | Engine phase | Engine surface (in `axiomancer-mechanics@0.6.0+`) | Mobile state today |
|---|---|---|---|
| A | Engine 09 — game loop | `createGameStore.moveToNode / processNode / applyDialogue` on `GameActions` | Mobile re-implements `moveToAction` in `state/actions.ts:645` over `worldCompleteNode + worldUnlockNode` and a local `getMapLayout` fixture; `processNode` / `applyDialogue` are not dispatched from any screen. |
| B | Engine 10 — moral meter | `selectMoralMeter`, `SHIFT_MORAL_METER`, `moralMeter` on `GameState` | No presenter reads `moralMeter`. No screen surfaces alignment. |
| C | Engine 11 — RNG seeding | `setRng`, `getRng`, `setSeed`, deterministic replay harness | Mobile tests don't seed; no replay harness. Acceptable until a debug overlay needs it, but the engine contract is unused. |
| D | Engine 12 / 21 — event surface | `createEventEmitter`, 7 typed event creators + 7 guards (`TypedGameEvent`, `is*Event`) | No consumer wired. Combat log lines in `state/actions.ts` are stringly-typed and re-derived per round. |
| E | Engine 14 — NPC + dialogue | `DialogueTree`, `getDialogueNode`, `applyDialogueChoice`, `visibleChoices` | No NPC / dialogue UI. Folds into Event-screen wiring (Phase 6). |
| F | Engine 18 — character presets | `characterPresets`, `getPresetById`, `buildCharacterFromPreset` | Mobile boots a single character via its own path; no preset picker. |
| G | Engine Spec 04b — skills library | `skillLibrary` (12 skills) + `getSkillById` (exported from `./Skills` internally) | Mobile reads from `state/mocks/combat.skills.fixture.ts` (6 hand-rolled rows). **Blocked**: engine doesn't re-export `skillLibrary` from its top-level `src/index.ts`. Phase 16 in mobile's plan tracks this. |
| H | Engine 09 + Spec 04 — skill resolution | `executeSkill`, `canUseSkill`, `spendResources`, `calculateSkillDamage` | `resolveRound` in `state/actions.ts` downgrades `action: 'skill'` to `'attack'`; passes a stub `skillLookup` returning `null`. Skill picks render but don't execute as skills. |
| I | Engine 23 / 24 / 25 — MapEvents | `resolveMapEvent`, 8 event kinds, `revealAdjacent`, `markNodeConsumed`; `processNode` deprecated | Mobile's exploration never calls `resolveMapEvent`. Node unlock propagation lives in `moveToAction` via the local `exploration-maps` fixture; the engine-side `pool → roll → resolve → consume` lifecycle is unused. Old `MapEvent`/`UniqueEvent` typed but referenced only in stubs. |
| J | Mobile spec 08 — Event screen | n/a (consumer-side) | `selectEventViewModel` returns `STUB_VM`; `selectHasActiveEvent` returns `false`. Phase 6 `[skipped]` on five "open product questions" — but reading `specs/08-event-screen-wiring.md` lines 63 / 72 / 80 / 85 / 89, **all five have answers filled in** (A / C / B / Future spec / Yes). The skip rationale is stale. |
| K | Engine 12 — `PersistenceAdapter` interface | exported from `axiomancer-mechanics`; RN adapter pattern documented in `docs/api.md` | Mobile's `state/persistence/` uses `AsyncStorage` and was wired before the engine's adapter contract was finalised. Worth re-grounding against the engine's exported interface so save/load is shaped by the engine, not duplicated. |
| L | Mobile presenter stubs | n/a | `navigation.engine.ts` carries 3 stubs (active events, XP/level-up, event-state checks) — all unlockable now that engine 09 / 10 shipped. `combat.engine.ts:289` keeps placeholder stance numbers "until Spec 05 lands" — Spec 05 has landed; the placeholders should be replaced with engine `deriveStats` reads. |
| M | Mobile copy hygiene | n/a | `state/actions.ts:9` still says "axiomancer-mechanics@0.3.0 does not ship a player mana slice yet" — stale by three minor versions. Several other comments name pre-Phase-21 engine names. Iterate-shaped. |

**Out of scope for this roadmap** — engine phases 13 (lint), 15 (resolver split),
16 (test layout), 17 (CLI unify), 19/20 (CLI debug/agent), 22 (authoring), 26 (validation harness):
these are internal to mechanics and do not change its consumer surface.

## 2. Cross-repo dependency chain

Two of the largest mobile gaps need engine action first. The
engine and mobile loops are independent, so these are coordination
points, not phase rows on either side.

1. **Engine 0.6.1 (or 0.7.0): top-level `skillLibrary` / `getSkillById` re-export.**
   Add to `axiomancer-mechanics/src/index.ts`:
   ```ts
   export { skillLibrary, getSkillById } from './Skills';
   ```
   Plus ensure `Skills/types.d.ts`, `Effects/types.d.ts`,
   `Combat/types.d.ts` land in `dist/` (currently missing per
   the Phase 16 brief). Unblocks mobile **G** and **H**.

2. **Engine confirmation: MapEvents stability.**
   Phase 25 (legacy `processNode` removal) shipped 2026-05-15. Mobile
   consumers should pin a release where `resolveMapEvent` is the
   only path. The currently-installed `axiomancer-mechanics@0.6.0`
   still includes `processNode` — verify before mobile **I** assumes
   the new shape only.

These are not blockers for everything: mobile can still close
the mobile-only gaps (J, K, L, M) on the current engine version.

## 3. Phased plan — mobile-side

Ordering is by dependency, not score. Each phase is sized to one
or two ticks of the existing build loop. Phase numbers continue
mobile's existing sequence (`plan/steps/01_build_plan.md` last used 16).

Each row links to:
- the engine phase it pulls forward,
- the spec the work draws from (mobile or engine),
- the realistic blockers / unblockers.

### Block I — Mobile-only catch-up (no engine release needed)

These shipped on the engine but the mobile consumer never reached
for them. They can ship today against the installed
`axiomancer-mechanics@0.6.0`.

#### Phase 17 — Drain stale presenter stubs (engine 10 + Spec 05 catch-up)

Closes mobile **B**, **L**, partially **M**.

- Replace `navigation.engine.ts`'s three TODO returns with reads:
  - active-event check via `selectHasActiveEvent` once that selector
    is real (see Phase 19 below) — until then leave a single
    `false` return with a `[needs-phase-19]` annotation, not three.
  - XP / level-up via `selectPlayer(state).level` and the
    `EXPERIENCE_PER_LEVEL` constant.
  - moral alignment via `selectMoralMeter` on the home / character
    badge (read-only display).
- Replace `combat.engine.ts:289`'s `STANCE_DERIVED` placeholder
  table with engine `deriveStats` calls keyed on the active stance.
- Sweep `state/actions.ts` header + the 4–5 stale "Spec 03 ships",
  "engine 0.3.0", "until Spec 04" comments and rewrite against
  the live shape.

**Size:** one tick. **Verify:** hermetic e2e for the moral-meter
read; existing tests should still pass. **Risk:** low.

#### Phase 18 — Un-skip Phase 6: Event screen wiring against `processNode` + `applyDialogue`

Closes mobile **A** (consumer side), **E**, **J**.

The five "open product questions" in `specs/08-event-screen-wiring.md`
are answered in the spec body (lines 63, 72, 80, 85, 89). The
engine half is present in `axiomancer-mechanics@0.6.0`. The
`[skipped]` marker on Phase 6 should be flipped to `[ ]` first,
then ship.

Concrete work:

- Replace `selectEventViewModel`'s `STUB_VM` with a real composition
  from `ProcessNodeResult` + the current `DialogueNode`. Two VM
  kinds per Q1=A: `combat-prelude` and `narrative-choice`.
- Expose machine-readable consequences (`{ kind, amount }[]`) per Q2=C
  alongside the description string.
- Slug → asset map stays mobile-local per Q3=B (drop a
  `state/presenters/event-assets.ts` for it).
- Mid-combat events out of scope per Q4 (future spec).
- "Skip" button per Q5=Yes — wire a presenter flag the screen
  consumes; long-text mode toggles it on.
- Action layer: `eventActions.pickChoice(choiceId)` dispatches
  `applyDialogue(tree, choice)` for dialogue trees and the
  appropriate engine handler for `MapEvent` choices. Compose,
  don't invent.
- Move `app/event.tsx` into `app/event/index.tsx` per the spec's
  "Move event.tsx into a folder" item; add `event.engine.ts` and
  `e2e/event.engine.test.ts`.
- Delete the `__DEV__`-gated variant toggle once the engine drives
  the variant.

**Size:** 3–5 ticks. The largest phase in this roadmap. May break
into sub-phases at plan-time:
1. presenter + happy-path e2e against a fixture `ProcessNodeResult`;
2. action layer wiring + dialogue path;
3. screen refactor + slug-asset map + skip button;
4. fixture removal + critique pass.

**Verify:** hermetic e2e per `specs/08-event-screen-wiring.md`'s
three checklist cases (happy path, no pending narrative, lifecycle).
**Risk:** medium — the spec's "compose from `ProcessNodeResult`"
guidance is non-trivial; expect at least one round of `/critique`
on the new presenter shape.

#### Phase 19 — `selectHasActiveEvent` real wiring

Trivial follow-on to Phase 18 — but lives as its own row because
it unlocks the third TODO in Phase 17 and gates `EventGate` in
`app/_layout.tsx` against real engine state. Closes **A** in the
gating direction.

**Size:** half a tick. Could fold into Phase 18 if the loop
prefers; kept separate so a critique pass can bracket it.

### Block II — Engine-release-gated

These wait on the engine republish in §2.1. None can ship until
the new version is on npm and `npm install` in mobile picks it up.

#### Phase 20 — Drain `combat.skills.fixture.ts` (engine Spec 04b consumer)

Closes mobile **G**. **Currently filed as Phase 16 in the mobile
plan with status `[skipped]`** pending engine package fix. This
roadmap row supersedes that one — when the engine release lands,
flip the Phase 16 row to `[ ]` and follow the existing brief at
`plan/phases/phase_16_engine_skills.md`. No re-planning needed.

**Size:** one tick (per the existing brief).
**Verify:** existing tests + new selector tests.
**Risk:** low once the engine ships; the brief is complete.

#### Phase 21 — Engine-driven skill resolution (`executeSkill` wiring)

Closes mobile **H**. The existing Phase 16 brief calls this out
as out-of-scope follow-up ("**Wire `executeSkill` into `resolveRound`**").

Concrete work:

- `state/actions.ts:resolveRound` stops hard-coding `action: 'attack'`
  when a skill is chosen; pass `action: 'skill'` and a real
  `skillLookup: SkillLookup` built from `getSkillById`.
- Drain the placeholder mana model — `manaCost = sum(resourceCost)`
  per the Phase 16 brief is a stopgap; once the engine resolves
  skills, the action layer should spend the engine's per-resource
  pool, not a single `mana` number.
- Update the combat presenter to surface engine-emitted
  `SkillPhaseEvent` rows in the log (severity + label).
- New e2e: pick a tier-1 skill → land a `damage` `SkillPhaseEvent` →
  HP delta matches `calculateSkillDamage`.

**Size:** 2–3 ticks. **Verify:** new skill-execution e2e plus a
regression sweep on the existing attack/defend log shape.
**Risk:** medium — touches the round-resolution summary loop;
log severities may need extension.

### Block III — Engine surface mobile never reached

Lower urgency than I & II — these are alignment / hygiene rather
than user-visible gaps.

#### Phase 22 — Character presets adoption (engine 18 consumer)

Closes **F**. Optional but cheap: the engine ships 4 calibrated
presets (fresh / mid / late / endgame). A `dev` overlay or
new-game flow can pick from them.

- New screen / overlay (boot or `__DEV__` menu): roster picker
  using `characterPresets`.
- `buildCharacterFromPreset` replaces whatever mobile boots the
  starting character with today (verify against existing flow).
- e2e: each preset loads → screens render against it without
  crashing.

**Size:** 1–2 ticks. **Risk:** low. Has no upstream blocker.

#### Phase 23 — MapEvents engine consumer (engine 23 / 24 / 25 catch-up)

Closes **I**. Largest catch-up alongside Phase 18; should not
land before either Phase 18 or Phase 21 because it interacts with
both Event-screen wiring and combat-prelude events.

Concrete work:

- Mobile's `moveToAction` switches to dispatching `processNode` /
  `resolveMapEvent` rather than re-implementing unlock propagation.
- `state/exploration-maps/` is repositioned as **visual layout only**
  (positions, hand-drawn edges) — the unlock graph comes from the
  engine via `revealAdjacent`. Reconcile / delete duplicated logic.
- Event-screen Phase 18 swaps from "dialogue-only" composition to
  the 8 kinds. Each kind needs presenter mapping (encounter →
  combat-prelude VM; interaction → narrative-choice VM; etc.).
- Hermetic e2e: discover → unlock → roll → resolve → exhaustion
  for at least 2 kinds; mirrors the engine's Phase 23 e2e shape.

**Size:** 3–4 ticks. **Risk:** medium-high — this is the most
likely place to surface a real engine-vs-mobile contract
mismatch that needs an engine patch release.

**Pre-req:** Engine on a version where `processNode` is removed
or labelled deprecated (engine Phase 25 already shipped). Pin
the engine to that release before starting.

#### Phase 24 — `PersistenceAdapter` re-grounding

Closes **K**. The mobile `AsyncStorage` adapter was wired before
the engine's `PersistenceAdapter` interface stabilised in engine
Phase 12 + 21. Likely already conforms; this phase is the
verification + de-duplication.

- Diff mobile's adapter against the engine's interface.
- Wire via the engine's contract type (`PersistenceAdapter` from
  `axiomancer-mechanics`); delete any local re-declaration.
- Reconcile migrations — engine has `GAME_STATE_VERSION` and
  `migrate`; mobile has its own runner. Pick one source of truth.

**Size:** 1 tick. **Risk:** low. Probably ships as an iterate row
rather than a phase if the diff is empty.

#### Phase 25 — Typed event surface consumer (engine 12 / 21 catch-up)

Closes **D**. Engine emits typed events; mobile rebuilds log
strings from `RoundResolution` in `state/actions.ts`. Swapping
the log pipeline to read engine events makes copy / severity
authoring live in one place.

- Subscribe to `createEventEmitter` output in the store; route
  typed events to the combat log presenter via `is*Event` guards.
- Drop the bespoke severity inference in `actions.ts`; let
  the typed-event payload drive it.
- Sweep stringly-typed combat log paths.

**Size:** 2 ticks. **Risk:** low-medium. Touches the round-by-round
log shape, so screen snapshots / e2e need an update.

### Block IV — Iterate residue (not phases)

Single-line fixes that don't deserve a phase row. Drained by
`/iterate` once the larger blocks are in flight.

- **M (copy hygiene):** stale version references in `state/actions.ts`
  comments; `combat.engine.ts:289` placeholder caveat; sweep for
  "until engine Spec NN lands" hedges that are now stale.
- **Phase 16 row cleanup:** once Phase 20 (this roadmap) ships,
  remove the `[skipped]` annotation from `plan/steps/01_build_plan.md`
  and add the closure entry.
- Outstanding critique-queue voice/comprehension rows in
  `plan/CRITIQUE.md` (3 pending) — drained per existing
  `/iterate` cadence; not in this roadmap's scope.

## 4. Suggested order — calendar shape

Loose ordering by what unblocks what. Sizes are tick-counts on the
existing mobile build loop (one "tick" ≈ one `/ship-a-phase` cycle,
which has historically been ~1 commit each).

```
mobile-only catch-up                                engine-release-gated
─────────────────────                              ─────────────────────
17 Stub drain          (1 tick)
18 Event screen        (3–5 ticks)  ──────────┐
19 selectHasActiveEvent (½ tick)              │
                                              │   engine ships 0.6.1
                                              │   with skillLibrary
                                              ▼   re-export
                                       20 Skills mock drain   (1 tick)
                                       21 executeSkill wiring (2–3 ticks)

                                                  alignment
                                                  ─────────
                                       22 Character presets   (1–2 ticks)
                                       23 MapEvents consumer  (3–4 ticks)
                                       24 PersistenceAdapter  (1 tick)
                                       25 Typed events        (2 ticks)
```

Block I starts immediately. Block II starts as soon as the engine
republishes (the mobile loop should keep Block I running in parallel
rather than stalling on engine work).

## 5. Done-state — what "aligned" means

Mobile is aligned with the mechanics package when:

- [ ] No `state/mocks/` directory (or the directory contains only
      ephemeral test fixtures, not production fallbacks).
- [ ] `event.engine.ts` reads `ProcessNodeResult` / `DialogueNode`
      / `MapEvent` from the engine; no `STUB_VM`.
- [ ] `resolveRound` dispatches `action: 'skill'` end-to-end via
      `executeSkill` when a skill is chosen.
- [ ] Exploration unlock propagation lives in the engine
      (`revealAdjacent` / `markNodeConsumed`), with
      `state/exploration-maps/` reduced to visual-layout-only.
- [ ] Moral meter is read by at least one presenter (character
      sheet or home badge).
- [ ] `selectHasActiveEvent` returns engine-truth, not `false`.
- [ ] Combat log consumes the engine's typed event stream rather
      than re-deriving severity per round.
- [ ] No comment in `state/` references "axiomancer-mechanics@0.3.x"
      or "until Spec NN ships" for a Spec that has shipped.

At that point `bearings.md` hard rule §6 ("Engine logic stays in
`axiomancer-mechanics`. No reimplementation here.") is true in
fact, not just in aspiration.

## 6. Things this roadmap deliberately does not touch

- **New screens or features.** Every phase above closes an
  existing gap; nothing here adds product surface.
- **Engine work.** The §2 dependency list is the only ask of the
  mechanics repo. Anything else stays in engine's plan.
- **Visual / asset / a11y polish.** Tracked in mobile's existing
  `/iterate` and `/critique` queues.
- **The Phase 6 `[skipped]` row in `plan/steps/01_build_plan.md`.**
  Don't unilaterally flip it to `[ ]` based on this roadmap alone —
  do it as Phase 18 commit's first step so the flip is captured in
  history with a real ship.

## 7. Risks and how they bite

| Risk | Where it lands | Mitigation |
|---|---|---|
| Engine 0.6.1 ships with a different export shape than the Phase 16 brief assumes | Phase 20 | The brief at `plan/phases/phase_16_engine_skills.md` is recipe-explicit. Diff before starting; replan if needed. |
| `resolveMapEvent` semantics aren't a clean superset of the mobile-local unlock fixture | Phase 23 | Plan-a-phase pass before the first tick; expect at least one engine patch release during Phase 23 to align edge cases. |
| Event-screen open questions reopen after a play-through | Phase 18 | Ship in the order the spec checklist names; if the loop hits an unanswered question mid-tick, drop a `[needs-user-call]` row instead of guessing. |
| Mobile copy goes stale again as engine ships new phases | Block IV | The roadmap's done-state §5 is a re-runnable checklist; treat it as an iterate template. |

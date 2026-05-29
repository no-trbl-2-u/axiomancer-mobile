# Phase 92 — Temporary encounter-shell modal for non-combat Event types

> User-direct promotion on 2026-05-29. T asked for an "encounter shell" modal for the multiple encounter types aside from combat: nothing fancy, just enough to prove the skeleton exists. These shells are temporary scaffolding until Event-type minigames are designed.

**Source-of-truth lines:**
- User directive, 2026-05-29: create an encounter shell modal for non-combat encounter types; update phases so `/march` picks up the work; document that the shells are temporary.
- `docs/temporary-encounter-shells.md` — temporary-shell doctrine and removal condition.
- Existing presenter surface: `state/presenters/event.engine.ts` maps `ResolvedEvent` kinds into `EventViewModel`.
- Existing modal surface: `components/event/EncounterModalOverlay.tsx` owns the sealed combat encounter arc; do not break it.

---

## Routes / API endpoints / CLI surface

No new routes required unless inspection proves the existing route/modal split prevents a clean shell.

Preferred route behavior:
- Combat encounters: keep rendering in `EncounterModalOverlay` over WILDS.
- Non-combat event encounters: render in a temporary encounter-shell modal over WILDS, then return to traversal after acknowledgement/resolution.
- The existing full-screen `/event` route may remain for legacy paced events during the migration, but Phase 92 should make the intended temporary modal shell explicit and tested.

## Content / data reads

| Source | Use |
|---|---|
| `state.event.pending.event.kind` | Determine which shell variant is being rendered. |
| `selectEventViewModel(state)` | Reuse existing title/body/choice/consequence copy wherever possible. |
| `ResolvedEvent` payloads | Preserve existing rest/gathering/loot/interaction/village/cutscene/hazard body and consequence data. |
| `docs/temporary-encounter-shells.md` | Explain why the shell is temporary and what is out of scope. |

## Components / handlers

**Enhanced:**
- Event modal rendering path — add or adapt a non-combat encounter shell that can render `narrative-choice` VMs as a sealed modal.
- Event acknowledgement handler — ensure the shell can resolve/clear the pending event and allow traversal to continue.
- Playtest/report copy if present — known temporary shells must not be reported as final minigames.

**Reused:**
- `selectEventViewModel` and its existing per-kind composition helpers.
- Existing event choices and consequence chips where available.
- Existing event art slug mapping.
- Existing combat `EncounterModalOverlay` phase machine for combat only.

**New:**
- Presenter/component tests proving at least two non-combat types render through the temporary shell.
- A regression test proving combat-prelude still enters the combat modal and does not get downgraded to the temporary narrative shell.

## Cross-links

**In (verify):** Existing event presenter tests, `EncounterModalOverlay` tests, exploration modal tests, and route-tree tests should keep passing.

**Out (ship):** Final Event-type minigames remain a later design phase. This phase only establishes the skeleton.

**Retro-fit:** If the current full-screen `/event` route already renders some non-combat types, preserve behavior until the modal shell replaces it safely. Do not delete useful route code just to satisfy the modal shape.

## SEO / metadata / output schema

N/A. Runtime UI shell only.

## Hero / body / sub-section composition

Temporary non-combat shell should be blunt and legible:

```text
[EVENT KIND BADGE]
TITLE FROM VM
Body from VM.

[primary acknowledgement choice]
```

It should visibly signal **TEMPORARY SHELL** or equivalent tester-facing copy in dev/test contexts if doing so will not pollute production tone. At minimum, comments and docs must name the temporary status.

## Empty / loading / error states

- `none` events still render no active modal.
- Unknown or unsupported event kinds should fail safe into a temporary shell with a generic acknowledgement, not silently vanish.
- Mid-combat events remain out of scope per the existing presenter Q4 contract.

## Decisions made upfront — DO NOT ASK

1. **Skeleton first.** This is not the minigame phase. Do not design final mechanics.
2. **Modal proof.** The goal is to prove non-combat Event types can appear in a modal shell and resolve back to traversal.
3. **Reuse presenter data.** Do not duplicate event copy/mapping in JSX when `selectEventViewModel` already provides it.
4. **Combat protected.** The existing combat-prelude → combat → aftermath modal arc must remain unchanged.
5. **Temporary status visible in docs.** Any placeholder copy, generic acknowledgement, or fallback shell must be called temporary in documentation and comments.

## Mobile reflow / responsive / paginate / output limits

The shell must work in small mobile viewports:
- scroll body text when long,
- keep the primary acknowledgement reachable,
- avoid adding another overgrown 700-line component if a small extracted component will do.

## Pages × tests matrix

| Surface | Unit | E2E |
|---|---:|---:|
| Non-combat event VM renders in temporary modal shell | ✓ | ✓ |
| At least two event kinds covered, e.g. `rest` + `hazard` or `gathering` + `cutscene` | ✓ | — |
| `none` event does not mount shell | ✓ | — |
| Combat-prelude still uses combat modal path | ✓ | ✓ |
| Acknowledge/continue clears or resolves pending event and returns to traversal | ✓ | ✓ |

## Verify gate

```bash
npm run verify
```

If the full verify gate is blocked by unrelated pre-existing failures, run and report the narrow checks first:

```bash
npm test -- event EncounterModalOverlay --runInBand
npx tsc --noEmit
```

## Commit body template

```text
feat(event): add temporary non-combat encounter shell modal — phase 92

- Render non-combat Event kinds through a temporary modal shell
- Reuse event presenter VM data and existing event consequences
- Preserve combat-prelude modal flow unchanged
- Document shell status as temporary until per-type minigames ship

Decisions:
- Skeleton only; no Event minigames in this phase
- Unknown non-none event kinds fail safe into a temporary shell
```

## DoD

- [ ] Read `docs/temporary-encounter-shells.md` before implementation.
- [ ] Locate current event route/modal split in `app/event/index.tsx`, `app/(tabs)/exploration/index.tsx`, `state/presenters/event.engine.ts`, and `components/event/EncounterModalOverlay.tsx`.
- [ ] Add/adapt a temporary non-combat encounter shell modal for `narrative-choice` event VMs.
- [ ] Ensure acknowledgement/continue resolves the pending event and returns to traversal.
- [ ] Preserve combat-prelude → combat → aftermath behavior.
- [ ] Add tests for at least two non-combat Event kinds.
- [ ] Add regression coverage that combat-prelude does not use the temporary narrative shell.
- [ ] Keep temporary status documented in code comments and docs.
- [ ] `npm run verify` passes or narrow failures are documented with exact commands/results.

## Follow-ups (out of scope)

- Per-Event-type minigame design.
- Hazard saving throws, gathering timing, village shop UI, rest-camp choices, or cutscene controls.
- Engine-side encounter recurrence fixes unless inspection proves the shell cannot be exercised without them.

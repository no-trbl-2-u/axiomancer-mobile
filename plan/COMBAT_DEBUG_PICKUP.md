# Combat-modal debug pickup brief

Self-contained context for resuming the [9.8] combat-mechanics
investigation in a fresh session. Delete this file once [9.8]
closes in `plan/AUDIT.md`.

## Status (HEAD `48ab19d`)

- Phase 63 (modal-contained encounter) shipped end-to-end.
- Phase 64 (multi-screen integration test harness) shipped.
- AUDIT [9.8] "Base combat mechanics not wired into UI" still
  open.

## What's been definitively ruled out

1. **Engine layer works.** Phase 64's integration tests pass:
   `actions.startCombat` → `setPlayerStance` → `setCombatPhase`
   → `setPlayerAction` → `resolveRound` advances
   `combat.phase` to `'resolving'` and returns a populated
   `endReason`. Direct-driven engine flow is fine.
2. **Touch handler fires.** Diagnostic toast (commit `169d44a`)
   appears on every action tap; `onPickAction` runs.
3. **`resolveRound` runs end-to-end.** Diagnostic logs (commit
   `4adb97a`) show entry → `updateCombat` call → post-update
   store reads `combat.phase=resolving, enemy.hp=0`. Engine
   state IS being mutated.
4. **Modal stays mounted across the event-slice clear.** Phase
   63c+ fix (`d460b64`) — user-confirmed.
5. **Hypothesis A (layout/scroll).** Auto-scroll fix (`8db068a`)
   didn't change the symptom.

## The actual bug (narrowed)

**Hypothesis C confirmed.** In
`state/presenters/combat.engine.ts:useCombatViewModel`, the
`useMemo` returns a stale `vm` despite the engine's `combat`
slice updating. User's console output proves it:

```
[actions.resolveRound] post-updateCombat store combat= {phase=resolving, enemy.hp=0, player.hp=10}
[CombatPanel.render] vm.phase= choosing_action engine.combat.phase= resolving isInCombat= true
[CombatPanel.render] vm.phase= choosing_action engine.combat.phase= resolving isInCombat= true
```

The OUTER `useGameState((s) => s.combat)` in `CombatPanel`
returns the fresh `combat` (phase=resolving), but
`useCombatViewModel`'s memoized vm still has
`vm.phase=choosing_action`. Both renders are stale.

## What we need next

**Resolved 2026-05-21 oversight 25th call** — user pasted the
new `[useCombatViewModel.*]` lines from build `48ab19d`. The
output picks **sub-hypothesis 2**:

```
[actions.resolveRound] post-updateCombat store combat=
  {phase=resolving, enemy.hp=60, player.hp=6}
[useCombatViewModel.hook] inner combat.phase= resolving
[useCombatViewModel.memo] RECOMPUTING — combat.phase= resolving
[useCombatViewModel.return] vm.phase= choosing_action   ← STALE
[CombatPanel.render] vm.phase= choosing_action
                     engine.combat.phase= resolving
```

The `useMemo` IS recomputing on the fresh
`combat.phase='resolving'`. Inner `combat.phase` matches outer
`engine.combat.phase` (rules out sub-hypothesis 3 + 4). But
the value `useMemo` emits has `vm.phase='choosing_action'`.

**Bug location:** `state/presenters/combat.engine.ts:selectCombatViewModel`.
Given `state.combat.phase = 'resolving'` it returns a vm with
`vm.phase = 'choosing_action'`. Either (a) the selector reads
phase from `localUi` / a captured snapshot instead of
`state.combat.phase`, (b) the phase-to-vm mapping doesn't
enumerate `'resolving'` and defaults to `'choosing_action'`,
or (c) something further down (e.g. `playerChoice.action`
gating) overrides the phase output.

**Plus user clarification:** "the heart select is just the
default choice. That needs to go away. There's no
default/starting stance." The earlier `[9.5] Heart cannot be
selected` AUDIT row was a misread — Heart is selectable but
appears pre-highlighted on combat entry, which made it look
unresponsive. Drop the default. Tick B of Phase 65.

**Filed as Phase 65** (combat regression cluster diagnostic)
— see `plan/steps/01_build_plan.md`. /march can pick it up
on next invocation.

## Files load-bearing for this bug

- `state/presenters/combat.engine.ts` —
  `useCombatViewModel` hook (with diagnostics).
- `state/GameStoreProvider.tsx` — `useGameState`,
  `useGameActions`, `useGameStore` from
  `useStore(zustand/react)`.
- `state/store.ts:createAppStore` — store creation; engine
  cast as AppStore.
- `state/actions.ts` — `resolveRound` (with entry/exit
  diagnostics).
- `app/(tabs)/combat.tsx` — `CombatPanel` (with render
  diagnostics, onPickStance/onPickAction toasts).
- `components/event/EncounterModalOverlay.tsx` — where
  `CombatPanel` mounts inside the modal.
- `state/combat-mode.tsx` — `inEncounterModal` flag +
  lifecycle.
- `app/(tabs)/_layout.tsx` — tab navigator; STRIFE hidden
  permanently per Phase 63d.

## Diagnostic streams currently live in code

To remove once [9.8] closes (one cleanup iterate tick):

- `[combat] onPickStance fired:` (combat.tsx)
- `[combat] phase after setCombatPhase:` (combat.tsx)
- `[combat] onPickAction fired:` (combat.tsx)
- `[combat] phase after resolveRound:` (combat.tsx)
- `[CombatPanel.render]` (combat.tsx)
- `[actions.resolveRound] entry/calling/post-updateCombat`
  (actions.ts)
- `[useCombatViewModel.hook/memo/return]` (combat.engine.ts)
- Diagnostic toast on stance/action taps (combat.tsx)

## User's testing context

- Web preview build via `expo export --platform web` + local
  server.
- Has dev console access.
- Modal mount + tab bar hide both confirmed working.
- Walking onto an encounter node, tapping FIGHT, tapping a
  stance, tapping an action — all visible/working through
  stance commit. Action commit is where it stalls.

## Skills / loop state

- `/march` cron cancelled (no scheduled jobs).
- Loop is at idle.
- Phase 62d / 62e `[paused]` (confirmed at oversight 25th call;
  stay paused).
- Phase 65 (combat regression cluster diagnostic) filed in
  `01_build_plan.md`. Phase 66 (modal aftermath) in
  `## Pending` candidates, gated on Phase 65.
- `plan/NEEDS_HUMAN_ATTENTION.md` has the testing-gap row
  (partially addressed by Phase 64).

## Workflow if you pick this up cold

1. `git pull` to HEAD `48ab19d` (or wherever main is).
2. Read `plan/AUDIT.md` Pending section for the [9.8] row's
   full investigation history.
3. Read this brief.
4. Ask the user to paste the latest dev-console output after
   tapping ATTACK in the modal — specifically the
   `[useCombatViewModel.*]` lines.
5. Pick the right sub-hypothesis from the four above; ship the
   fix in one tick.
6. Once [9.8] closes: write an iterate tick to remove all
   diagnostic streams listed above and delete this file.

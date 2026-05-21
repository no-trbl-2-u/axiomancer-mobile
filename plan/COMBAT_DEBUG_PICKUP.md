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

User retests with the latest diagnostic build (`48ab19d`) and
pastes the new `[useCombatViewModel.*]` log lines. Those pick
between four sub-hypotheses:

- `RECOMPUTING` never fires → useMemo deps aren't triggering
  (reference comparison broken somehow).
- `RECOMPUTING` fires with `combat.phase=resolving` →
  `selectCombatViewModel` produces fresh, but something
  downstream caches the old vm.
- `RECOMPUTING` fires with `combat.phase=choosing_action` →
  `useGameState` inside the hook returns stale (separate from
  outer).
- Inner `combat.phase` differs from outer
  `engine.combat.phase` → provider-scope mismatch (two
  providers?).

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
- Phase 62d / 62e `[paused]`.
- Phase 65 (modal aftermath) in `## Pending` candidates, gated
  on [9.8].
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

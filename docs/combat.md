# Combat screen

> The engine — [`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
> (`^0.37.0`) — owns combat rules. This doc describes only what the
> **screen** renders and how data flows.

Combat is the **Hazard-Pattern** system: card / dice / hidden-read /
Conviction / Signature. The enemy has a **single bar — HP**. There is no
turn-based stance/action/skill round loop, no mana bar, and no
`resolveCombatRound`; those were removed when the engine moved to the
Hazard-Pattern model.

The combat surface is the reusable panel at
[`components/combat/encounter/CombatEncounterPanel.tsx`](../components/combat/encounter/CombatEncounterPanel.tsx).
It is hosted in two places:

- **Live map flow** — [`components/event/EncounterModalOverlay.tsx`](../components/event/EncounterModalOverlay.tsx)
  mounts the panel in-place inside the encounter modal with
  `persistOutcome`, feeding it the real enemy + player.
- **Dev sandbox route** — [`app/combat-encounter/index.tsx`](../app/combat-encounter/index.tsx)
  bootstraps a mock foe + demo deck and does **not** persist the outcome
  (a throwaway sandbox for manual/visual testing).

All math, RNG, and state shaping happen in the engine; the screen shapes
one frozen view-model in the presenter at
[`state/presenters/combat-encounter.engine.ts`](../state/presenters/combat-encounter.engine.ts).

## Data flow

```text
CombatEncounterState  ──►  buildCombatViewModel(state)  ──►  CombatViewModel
   (engine truth)                                                  │
                                                                   ▼
                                                       CombatEncounterPanel JSX
                                                                   │
                                                      Pressable / drag-die → card
                                                                   │
                                                                   ▼
                                                       engine transition fns
                                                (playCombatCard, resolveThreatPhase, …)
```

The panel holds the live `CombatEncounterState` and advances it by
calling engine transition functions directly (each returns
`{ state, … }`; the panel keeps `.state`). It never dispatches a mobile
combat reducer and never reimplements combat logic. The engine entry
points it consumes from `axiomancer-mechanics` are:

`initializeCombatEncounter`, `rollEncounterDice`, `startTurn`, `endTurn`,
`draftStanceDie`, `playCombatCard`, `discardCombatCard`,
`playSignatureSkill`, `resolveThreatPhase`, `selectEncounterMercyChoice`,
`buildCombatSummary`, `rollCombatCardRewards`, `addRewardCard`.

## Turn flow

1. **Reveal** the phase, then **roll** the turn's dice pool.
2. **Draft** one die — the other die feeds **◆ Conviction**.
3. **Power** a card by dragging the drafted stance die onto it (dice are
   optional; an un-powered card plays free/weaker — the hazard model).
   Multiple cards can be staged in a turn.
4. **End turn** to re-roll a fresh pool.
5. **End phase** to resolve the enemy's telegraphed threat.

Status effects are the efficient way to drop enemy HP to 0: damage-over-
time erodes HP faster than a bare basic strike, and control denies the
enemy its telegraphed turn.

## `CombatViewModel`

`buildCombatViewModel(state: CombatEncounterState)` produces the frozen
view-model the panel renders. Its slices:

| Slice | What renders |
|---|---|
| `enemy` | Name / art, boss flag, **HP bar only** (`hp` / `maxHp` / `hpPct`), effect chips, telegraphed `intent`, and the `revealedStance` (once read/scouted). |
| `player` | HP bar (`hp` / `maxHp` / `hpPct`), `guard` (one-shot shield), effect chips. |
| `dice` | The turn's mana dice — colour (Body = red, Mind = blue, Heart = purple, Wild = gold `x`), drafted/spent state, and a per-die hidden-**read** pip once the phase stance is known. |
| `drafted` / `hasDraft` / `needsDraft` / `diceRolled` | Draft + roll state that gates the board. |
| `read` | Hidden-read view (advantage of drafted die colour vs. the enemy's stance). |
| `conviction` | The ◆ Conviction pool (fed by the undrafted die). |
| `signatures` | Available Signature skills. |
| `hand` | The player's playable cards (`CombatCardVM`, with honest face + detail). |
| `ledger`, `phaseBadge`, `roundLabel`, `turnLabel`, `deckCount`, `discardCount` | Phase/turn framing and deck counters. |

## Outcomes

The engine's terminal `CombatOutcome` is `'victory' | 'mercy' | 'defeat'
| 'retreat'`. When `state.finalOutcome` is set the panel builds a summary
via `buildCombatSummary` and the live map flow renders the matching
aftermath panel from
[`components/event/aftermath/`](../components/event/aftermath/):
`CombatVictoryPanel`, `CombatDefeatPanel`, or `CombatFriendshipPanel`.
Mercy / befriend is chosen through `selectEncounterMercyChoice`.

## Tests

| What | Where |
|---|---|
| Card view-model composition | [`state/presenters/__tests__/combat-card-vm.test.ts`](../state/presenters/__tests__/combat-card-vm.test.ts) |
| Engine store lifecycle through the encounter | [`state/e2e/store.engine.test.ts`](../state/e2e/store.engine.test.ts) |
| Screen render — combat encounter | [`state/e2e/combat-encounter.screen.test.tsx`](../state/e2e/combat-encounter.screen.test.tsx) |
| Board — multi-card staging | [`components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx`](../components/combat/encounter/__tests__/CombatBoard.multistage.test.tsx) |

`npm test` must pass twice in a row and `npx tsc --noEmit` must be clean
before declaring a combat change done. See
[`docs/testing.md`](./testing.md).

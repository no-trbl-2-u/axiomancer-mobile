# Temporary encounter shells

> Status: temporary implementation doctrine for Phase 92. These shells exist to prove the encounter skeleton, not to define final Event minigames.

## Purpose

Axiomancer has multiple map encounter types beyond direct combat: `rest`, `gathering`, `loot-cache`, `interaction`, `village`, `cutscene`, `hazard`, and future event-like branches. Until bespoke minigames exist, the mobile client should still prove that every non-`none` map event can enter a sealed encounter modal, show a minimal body, accept one continuation choice, resolve, and return the player to traversal.

The shell is scaffolding. It is a beam, not the cathedral.

## Temporary contract

- Render non-combat map events in a modal shell rather than treating them as absent or unknown regressions.
- Reuse the existing event presenter data where possible (`selectEventViewModel`, `EventChoice`, `EventViewModel`).
- Keep the interaction simple: one obvious continuation/acknowledge action is enough unless the engine already provides choices.
- Mark copy and comments as temporary where they stand in for future type-specific minigames.
- Do not introduce final minigame rules, timing systems, puzzles, skill checks, resource economies, or authored bespoke loops in this phase.
- Do not disturb the existing combat-prelude → combat → aftermath modal arc.

## Expected Phase 92 behavior

- Combat encounters keep using `EncounterModalOverlay` and its combat phase machine.
- Non-combat events get an encounter-shell modal with minimal chrome and continue/acknowledge resolution.
- The shell should make event type visible to testers so Kid/Judge reports can distinguish:
  - implemented temporary shell,
  - known missing final minigame,
  - true regression.

## Out of scope

- Final minigames for each Event type.
- Balance, rewards redesign, shop UI, hazard saving throws, gathering mechanics, or bespoke cutscene controls.
- Engine schema changes unless inspection proves the mobile shell cannot resolve existing `ResolvedEvent` kinds.

## Removal condition

A shell stops being temporary only when its encounter type has a designed and tested minigame or bespoke flow, documented in the relevant phase/spec and covered by presenter/component tests.

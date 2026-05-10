# Spec 05 — Character Screen Wiring

## Goal

Replace `app/(tabs)/character.tsx`'s hard-coded base / derived /
saves / effects / equipment fixtures with engine-driven data via
`selectCharacterViewModel`.

**Success state:** XP, level, base stats, derived stats, save / test
modifiers, active effects, equipment slots, and luck all read from
the engine. The body diagram's slot anchors map to real equipped
items. Stat upgrades dispatch through the engine when (Spec 06)
character progression ships.

## Why now / dependencies

- **Unblocks:** Spec 06 (character progression) — having a real
  read-only character screen surfaces what the engine still needs
  to expose.
- **Depends on:** Spec 01, 02, 03.

## Current state

- `app/(tabs)/character.tsx` has literal `BASE`, `DERIVED`, `LUCK`,
  `SAVES`, `EFFECTS`, `SLOTS` constants (lines 11–46).
- The body diagram (`components/BodyDiagram.tsx`) draws slot anchors
  at fixed positions; equipped item names are passed in as props.
- The engine exposes `Character`, `BaseStats`, `DerivedStats`,
  `NonCombatStats`, `deriveStats`, `calculateMaxHealth` (per the
  engine README).

## Open questions

1. **XP rendering.** Mock shows `412 / 600`. Engine Spec 06 hasn't
   shipped progression. Options:
   - (A) **(default)** Show `xp` from engine if exposed; fall back to
     `0 / nextLevel(level)` until Spec 06.
   - (B) Hide XP entirely until Spec 06.
   > Your answer:

2. **Saves vs. tests.** Mock shows three saves and three tests. The
   engine has `getSaveStat` and `getResistStat` (per README) — confirm
   one maps to each. If not, propose what `Body Test +2` actually
   represents.
   > Your answer:

3. **Equipment slot mapping.** Mock has Head / Body / Hands / Feet /
   Weapon / Armor / Accessory. Engine `Item` types include weapon /
   armor variants (per README's `Items` group). Map 1:1 or rework?
   > Your answer:

4. **Stat upgrade buttons.** Are level-up stat picks part of this
   spec or deferred to Spec 06?
   - (A) **(default)** Deferred — character screen is read-only here.
   - (B) Implement a "+ stat" button that's disabled until Spec 06
     gives the engine a `pendingPoints` field.
   > Your answer:

5. **Visual treatment for stats below threshold.** Mock tints
   `Heart Save 10` with a particular accent. Should we drive the tint
   from the value (e.g. `< level → blood; >= level → parchment`) in
   the VM?
   > Your answer:

## Proposed approach

1. **Move `character.tsx` into a folder** — `app/(tabs)/character/index.tsx`
   plus `character.engine.ts`, `e2e/character.engine.test.ts`.
2. **Implement `selectCharacterViewModel`** consuming `state.player`
   and `state.session?.xp`.
3. **Refactor screen** to read `vm = useGameState(selectCharacterViewModel)`.
4. **Hermetic e2e**:
   - Happy path: a full `createCharacter` fixture → VM has correct
     base / derived / saves.
   - Boundary: 0 XP, max-level character, character with 0 HP.
   - Effects: VM passes through active effects with stable ordering.
   - Lifecycle: `createGameStore(memoryAdapter, …)` → mutate player
     → presenter reflects the change.

## Acceptance checklist

- [ ] All 5 questions answered.
- [ ] `app/(tabs)/character/` folder exists.
- [ ] No literal `BASE`, `DERIVED`, `SAVES`, `EFFECTS`, `SLOTS` in the
      screen.
- [ ] Hermetic e2e green; component render test exists.
- [ ] `npm test` and `npx tsc --noEmit` clean.

## Out of scope

- Stat upgrade UI — Spec 06.
- Equipping items — Spec 06 (gear flow).
- Skill book / known skills — engine Spec 04 + a future mobile spec.

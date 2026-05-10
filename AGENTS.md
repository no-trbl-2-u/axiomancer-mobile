# AGENTS.md

## Cursor Cloud / Claude Code specific instructions

### Project overview

Axiomancer Mobile is the **React Native / Expo client** for the Axiomancer
TTRPG. It is a thin presentation layer on top of the
[`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
engine: all game rules, state shape, and randomness live there. This repo
owns screens, navigation, theming, fonts, SVG/asset placeholders, and the
glue (selectors / presenters) that maps engine state to UI props.

See [`README.md`](./README.md) for architecture docs.

### Key commands

All commands are in `package.json`:

| Task | Command |
|---|---|
| Start dev server (Metro) | `npm start` |
| Start on Android | `npm run android` |
| Start on iOS | `npm run ios` |
| Start on web | `npm run web` |
| Lint (Expo's ESLint config) | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Test (Jest) | `npm test` *(once Spec 01 lands)* |

> **Type-check is the most reliable static-analysis check in this repo
> today** — `npm run lint` runs `expo lint` which works, but the test
> harness is not yet bootstrapped. Spec 01 in `specs/` exists for the
> express purpose of installing `jest-expo` + `@testing-library/react-native`
> and writing the first hermetic e2e test. Until that lands, "tests pass"
> means `npx tsc --noEmit` is clean.

### Caveats

- **No test runner is installed yet.** `package.json` has no `test` script
  and no `jest` config. **Spec 01** (`specs/01-test-harness-setup.md`) is
  the prerequisite for every other spec — pull it first.
- **Hard-coded mock data lives in screens.** `app/(tabs)/combat.tsx`,
  `app/(tabs)/character.tsx`, etc. all hold their own `useState` + literal
  fixtures. The migration plan is: extract pure presenter functions
  (`<screen>.engine.ts`) → wire them to `createGameStore` from
  `axiomancer-mechanics` → keep screens as `<screen>.tsx` UI shells.
  See Specs 02 + 03.
- **SVGs are placeholders.** Every SVG in this codebase (stance glyphs,
  effect glyphs, action icons, enemy art) is a coded placeholder. The
  swap contract is documented in [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md).
- **Path alias `@/*` resolves to repo root** — see `tsconfig.json`.
- **Fonts must finish loading before splash screen hides.** See
  `app/_layout.tsx`. Tests should mock `expo-font`'s `useFonts` to return
  `[true]` so screens render synchronously.
- **Reanimated requires a Babel plugin.** Test harness must include
  `react-native-reanimated/mock` (Spec 01 covers this).

### Hermetic E2E testing — REQUIRED

Every implementation must land with at least one **hermetic e2e test**
that drives the change through the highest-level public entry point of
its module. If you cannot, extract logic until you can — or document
the "hermetic-test debt" in the PR description with a concrete reason.

**Hermetic** = self-contained (no network, no `AsyncStorage`, no real
fonts, no real timers, no animations) + deterministic
(`Math.random` stubbed, fake timers when needed) + isolated
(`afterEach(() => jest.restoreAllMocks())`).

- **Standard:** [`docs/testing.md`](./docs/testing.md) (canonical).
- **Reference test:** the first one to land via Spec 01 will become the
  canonical reference; until then, mirror the structure of
  `axiomancer-mechanics/src/Combat/e2e/combat.engine.test.ts` (its
  alternating-RNG helper + win-condition split is the model).
- **Location:**
  - **Pure presenter / engine logic:** `app/<screen>/e2e/<feature>.engine.test.ts`
    next to `app/<screen>/e2e/<feature>.engine.ts`.
  - **React component rendering:** `components/<Component>.test.tsx`
    rendered via `@testing-library/react-native`.
- **Stub helpers:** keep all randomness behind `axiomancer-mechanics`'s
  RNG abstraction (see Spec 11 in the engine repo) plus a local
  `app/test-utils/` mirror once Spec 01 ships.
- **Verification:** `npm test` green twice + `npx tsc --noEmit` clean
  before declaring done.

### Recommended workflow when picking up new work

1. Read `specs/README.md` and pick the topmost spec that isn't marked
   `[DONE]` and has its open questions answered.
2. If section 4 of the spec has unanswered questions, **answer the
   questions** before writing code. Answers are a deliverable; the spec
   is the source of truth.
3. Once answered, work through the spec's "Proposed approach" as
   discrete commits on a feature branch.
4. Tick the spec's acceptance checklist as you go; mark it
   `[DONE on YYYY-MM-DD — see PR #N]` at the top when finished.

# AGENTS.md — Project Orientation

> **Note:** This file provides project-specific context and technical
> details. For current autonomous loop instructions and workflow rules,
> see [`agents.md`](./agents.md) (the nexus rule book).

## Project overview

Axiomancer Mobile is the **React Native / Expo client** for the Axiomancer
TTRPG. It is a thin presentation layer on top of the
[`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
engine: all game rules, state shape, and randomness live there. This repo
owns screens, navigation, theming, fonts, SVG/asset placeholders, and the
glue (selectors / presenters) that maps engine state to UI props.

See [`README.md`](./README.md) for architecture docs and [`plan/bearings.md`](./plan/bearings.md) for current project context.

## Key development commands

| Task | Command |
|---|---|
| Start dev server (Metro) | `npm start` |
| Start on Android | `npm run android` |
| Start on iOS | `npm run ios` |
| Start on web | `npm run web` |
| Lint (Expo's ESLint config) | `npm run lint` |
| Type-check | `npx tsc --noEmit` |
| Test (Jest) | `npm test` |
| Full local verify | `npm run verify` |

## Technical constraints

- **Path alias `@/*` resolves to repo root** — see `tsconfig.json`.
- **SVGs are placeholders.** Every SVG in this codebase is a coded
  placeholder. The swap contract is documented in
  [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md).
- **Fonts must finish loading before splash screen hides.** See
  `app/_layout.tsx`. Tests should mock `expo-font`'s `useFonts` to return
  `[true]` so screens render synchronously.
- **Reanimated requires a Babel plugin.** Test harness includes
  `react-native-reanimated/mock` for test compatibility.

## Testing standard

See [`docs/testing.md`](./docs/testing.md) for the complete hermetic e2e
testing standard. Every implementation requires hermetic test coverage
at the presenter/engine level (`state/e2e/`) or component level
(`components/__tests__/`).

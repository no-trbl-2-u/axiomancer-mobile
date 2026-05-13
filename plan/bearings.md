# Bearings — Axiomancer Mobile

> Standing context for every command invocation. Read this
> alongside the relevant skill file (`skills/<name>.md`) and
> the matching phase brief. If anything here changes, update in
> the same commit.

## What we're building

`specs/README.md` + `README.md` together are the de-facto product
spec. The TL;DR:

> **Axiomancer Mobile** is the React Native / Expo client for the
> Axiomancer TTRPG — a thin presentation layer on top of the
> [`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
> npm engine.

All rules, state shape, and randomness live in the engine. This
repo owns five tab screens (combat / character / exploration /
inventory / event), navigation, theming, fonts, SVG/asset
placeholders, and the **presenter** glue that maps engine state
to view-models.

**Distributed via EAS Build.** No public URL — the artifact is
an iOS/Android binary delivered to TestFlight + Play Internal
Track.

## Surface

**Surface:** `service`

> Mobile native apps don't fit the canonical `site / service /
> library / cli / hybrid` matrix cleanly. We pick `service` so
> that the opt-in branding capability (`/ship-asset` + `brander`
> sub-agent) is disabled — the app surface is a binary, not a
> walkable URL, so the asset pipeline used by web nexus projects
> doesn't apply. Asset swaps for in-app SVGs follow the
> pre-existing `.cursor/skills/swap-asset-placeholder/SKILL.md`
> flow, not `/ship-asset`.

`/critique` is correspondingly limited: there is no live URL for
`reader` to walk. Until a web target ships (low priority — see
phase candidates), `/critique` operates against
`docs/`, `specs/`, and built artifacts only, treating "how a
fresh maintainer would experience this repo" as the proxy.

## Auth

**Auth:** `none` — there is no critique URL to authenticate
against. The game has no online accounts; everything is local.

## Stack (locked — do not re-litigate)

| Layer | Choice | Why |
|---|---|---|
| Repo | single repo (npm) | Small surface; engine lives in separate npm package. |
| Framework | Expo SDK 54 + expo-router 6 | File-based routing; native + web targets. |
| Language | TypeScript 5.9, strict | Catches presenter / view-model contract mismatches early. |
| Runtime | React 19.1, React Native 0.81 | Pinned by Expo 54. |
| Routing | expo-router (file-based) | Standard Expo idiom. |
| State (UI) | Local `useState` per screen → migrating to a `zustand` store wrapping `createGameStore` from `axiomancer-mechanics` (see spec 02). | Engine is the source of truth; the store is a thin reactive wrapper. |
| Engine | `axiomancer-mechanics` npm package (pinned ^0.4.x) | Rules, RNG, reducers. **Never reimplemented in this repo.** |
| Persistence | none yet → `AsyncStorage` adapter (spec 09) | Game state survives app restart. |
| Test runner | Jest 29 + `jest-expo` + `@testing-library/react-native` | Already wired; canonical hermetic-e2e harness. |
| Lint | `expo lint` (ESLint 9, `eslint-config-expo`) | Bundled with Expo. |
| Typecheck | `tsc --noEmit` | Most reliable static check in this repo. |
| Styling | Inline `StyleSheet` + tokens from `theme/axm.ts` | No Tailwind / no CSS-in-JS. |
| Fonts | `@expo-google-fonts/{pirata-one,im-fell-english,bebas-neue,jetbrains-mono}` via `useFonts` in `app/_layout.tsx` | Loaded before splash hides. |
| SVG | `react-native-svg` 15.x; every glyph is a coded placeholder (see `SVG_ASSET_SPEC.md`). | Real artwork ships via the asset-swap workflow. |
| Build / distribution | EAS Build (`eas.json`: preview = APK; production = all) | The mobile equivalent of "deploy". |
| Pkg manager | npm (lockfile committed) | Matches existing scripts. |

## External services

| # | Service | Runbook | Status | Notes |
|---|---|---|---|---|
| 01 | GitHub | _(not wired — see `[needs-user-call]` below)_ | STUB | Repo at `no-trbl-2-u/axiomancer-mobile`. `GH_TOKEN` needed for `/triage`. |
| 02 | EAS Build (Expo) | _(not wired — see `[needs-user-call]` below)_ | STUB | `eas.json` exists with preview / production profiles. `EXPO_TOKEN` needed when the deploy gate stops being a stub. |
| 03 | npm (engine package) | n/a | OK | `axiomancer-mechanics` consumed via `npm install`. |

The `setup/NN_*.md` runbooks are not yet authored — they're
queued in phase candidates. Until then, treat `agents.md`
"Operational secrets" as the canonical config doc.

## Identity tiers / auth provider / anti-abuse / moderation / AI usage map

**Not applicable.** Single-player offline mobile game. No
accounts, no UGC, no AI in the product itself. (The build loop
uses AI; the game does not.)

## URL / API / CLI contract (locked)

This project has no URL / API / CLI surface. The contracts that
**are** locked:

- **expo-router file routes** under `app/(tabs)/`:
  `combat`, `character`, `exploration`, `inventory`, `event`.
  Tab order may change; route names do not without a deliberate
  navigation-phase commit.
- **Presenter contract**: every screen has a colocated pure
  function `select<Screen>ViewModel(state) → ViewModel` in
  `app/<screen>/<screen>.engine.ts`. The screen consumes the
  view-model; never reads engine state directly. See
  [`docs/presenters.md`](../docs/presenters.md).
- **Theme tokens**: `theme/axm.ts` exports `AXM.{bg, parchment,
  blood, sulfur, rust, bone, ash}` and `FONTS.{pirata, fell,
  fellItalic, bebas, mono}`. New screens consume these tokens;
  no hex literals in components.
- **`axiomancer-mechanics` API**: pinned semver; engine bumps
  are an explicit phase, not background.

## Repository shape

```
axiomancer-mobile/
├── README.md                            (project overview)
├── AGENTS.md                            (pre-nexus orientation — preserved)
├── agents.md                            (nexus rule book)
├── package.json
├── tsconfig.json
├── jest.config.js / jest.setup.ts
├── eslint.config.js
├── metro.config.js
├── app.json / eas.json
├── app/                                 expo-router routes
├── components/                          presentational components
├── state/                               engine store + presenters + e2e
├── theme/                               tokens
├── assets/                              fonts + images
├── test-utils/                          hermetic-test helpers
├── docs/                                testing standard + prompts
├── specs/                               12 spec-driven planning docs
├── plan/                                nexus build plan + briefs + queues
│   ├── README.md
│   ├── bearings.md                      (this file)
│   ├── AUDIT.md
│   ├── CRITIQUE.md
│   ├── PHASE_CANDIDATES.md
│   ├── AUDIT_BRIEF.md / [needs-user-call] log
│   ├── steps/01_build_plan.md
│   └── phases/phase_<N>_<topic>.md
├── skills/                              nexus skill source-of-truth
├── .claude/
│   ├── commands/                        slash-command pointers
│   └── agents/                          sub-agent definitions
├── scripts/                             deploy-check.mjs (stub) + helpers
└── SVG_ASSET_SPEC.md                    SVG-swap contract
```

## The `design/` folder

This project does not currently use a `design/` export folder
(no Figma source / no claude-design pipeline). Visual decisions
live in `theme/axm.ts`, `SVG_ASSET_SPEC.md`, and the per-screen
specs. If a design system is ever commissioned (see
`nexus/customization/visual-system.md`), drop exports under
`design/` and update this section.

## Sub-agents

| Agent | When to spawn | Returns |
|---|---|---|
| `scout` | External fact, spec link, API reference, RN/Expo doc | Structured findings with citations |
| `reader` | Doc-tree / repo-as-cold-reader observation (no live URL) | JSON findings array |
| `generic-specialist` | Clone when a domain specialist is justified (e.g., `engine-bridge`, `a11y-auditor`) | Per-specialist |

## Visual & tonal defaults

Authoritative file: [`theme/axm.ts`](../theme/axm.ts).

- **Mode:** dark-only by design (Axiomancer is a gothic TTRPG).
- **Palette:** `bg` near-black, `parchment` ivory, `blood` red,
  `sulfur` yellow, `rust` orange, `bone` muted, `ash` borders.
- **Type families:**
  - **Pirata One** — gothic display headers.
  - **IM Fell English** — body serif (regular + italic).
  - **Bebas Neue** — sans labels (buttons, section labels).
  - **JetBrains Mono** — numerics (HP / damage / rolls).
- **Voice:** terse, archaic, ritual. Avoid modern fluff in
  in-game copy.

## Plan expansion posture

`/expand` reads accumulated signals (audit findings, critique
findings, GH issues, spec drift, design landings, data growth)
and proposes new phase candidates.

- **Mode: bold** (default). `/expand` runs at standard cadence
  and files candidates to `plan/PHASE_CANDIDATES.md`. `/oversight`
  promotes them to the build plan.

## Decisions standing for the autonomous loop

(These exist so the loop never asks the user. Add to this list
any time you encounter a recurring class of ambiguity.)

- **State source of truth:** the `axiomancer-mechanics` engine.
  Anything that looks like a rule or RNG belongs there, not here.
- **Presenter purity:** presenters are pure
  `(state) → ViewModel`. No side effects, no I/O. Tests assert
  on the view-model.
- **Hard-coded fixtures are debt:** screens still holding their
  own `useState` mock data are flagged in `AUDIT.md` for
  presenter migration.
- **Asset placeholders ship:** the loop does not block on real
  artwork. Placeholders satisfy verify; real assets are a
  separate per-asset phase (`spec 11`).
- **No analytics in v1.** Privacy-by-default; no third-party
  SDKs.
- **No accounts, no online play, no AI-in-product in v1.**
- **Test scope:** every commit ships hermetic tests against the
  presenter / store. Component snapshot tests are optional and
  not part of verify.
- **Loop pushes directly to `main`.** Brownfield retrofit
  option B (the user trusts trunk). PR-based work happens
  outside the loop.
- **Empty state copy template:** `"<verb> nothing here yet — <next-action>."`
  (terse, archaic).
- **Loading state:** parchment-on-bg skeleton via existing
  components; no spinners.
- **Error state:** blood-coloured `IM Fell English` italic with a
  retry call-to-action; never expose stack traces.
- **Top-N count for any list:** 8 (matches existing inventory
  view density).
- **Top-priority unknowns surface as `[needs-user-call]` rows
  in `plan/AUDIT.md`**, not blocking questions.

## Hard rules

(Mirrors `agents.md` Standing Rules. Update there first; this
echoes.)

1. **Commit and push as a single atomic act.**
2. **No `Co-Authored-By:` trailers, no emojis.**
3. **No `--no-verify`, no force-push, no destructive resets.**
4. **The verify gate is non-negotiable** — see "Verify gate"
   below.
5. **Tests alongside code** — hermetic e2e for every change.
6. **Engine logic stays in `axiomancer-mechanics`.** No
   reimplementation here.
7. **SVGs in `components/` are placeholders.** Swap via
   `.cursor/skills/swap-asset-placeholder/SKILL.md`.
8. **No hardcoded copy in components.** Strings live in the
   presenter or a per-screen `<screen>.copy.ts` module.
9. **Never commit secrets.**
10. **The verify gate is currently RED** on a pre-existing
    typecheck failure in `state/actions.ts` and
    `state/e2e/inventory.*.test.ts` — the latest
    `axiomancer-mechanics` bump renamed
    `Consumable.effect → effectId` and added required fields
    `rarity` + `requiredLevel` on `Equipment`. **Until Phase 2
    (engine-API-drift fix) ships the migration, the loop
    CANNOT autonomously commit** — manual `/ship-a-phase`
    only, at intervention spectrum level 0. See `plan/AUDIT.md`
    [HIGH] row.

## Verify gate (hermetic, mandatory) + deploy gate

### Pre-commit: `npm run verify`

```
npm run lint            # expo lint (ESLint 9, eslint-config-expo)
npx tsc --noEmit        # strict TypeScript check
npm test                # jest (jest-expo preset, hermetic by AGENTS.md §"Hermetic E2E testing")
```

Each leg is a hard gate. **Hermetic Jest tests** are the
load-bearing piece — every implementation must land with at
least one presenter / store e2e per
[`docs/testing.md`](../docs/testing.md).

There is no separate "build" leg for the verify gate. Metro
bundles at runtime; a true native build is what EAS Build does
post-push (the deploy gate's responsibility). If a typecheck or
test failure correlates with a Metro-only edge case, file an
`AUDIT.md` row to add a `metro:bundle` smoke step.

### Post-push: `npm run deploy:check`

Currently a **stub** that exits `0` with a notice. When the EAS
Build wiring lands (see phase candidates), it polls
`https://api.expo.dev/v2/projects/<id>/builds` for the build
matching HEAD's commit SHA and exits per the standard contract:

```
0 → build ready (artifact uploaded)
1 → build errored / failed
2 → timeout
3 → config / auth (EXPO_TOKEN missing or rejected)
```

Implementation: `scripts/deploy-check.mjs`.

**Red build = blocked tick.** Read log via `eas build:view`,
patch root cause, push again. Up to 3 same-root-cause
iterations; otherwise stop per the skill's failure modes.

## Operational notes

- **No auto-deploy from `main`.** EAS Build runs are triggered
  manually via `npm run deploy:preview` / `npm run deploy:production`.
  The deploy gate, once real, polls the most-recent build's
  status against the just-pushed commit.
- **Operational secrets** in `.env` (gitignored). See
  [`agents.md`](../agents.md) "Operational secrets" section.

## Useful commands

```bash
npm install
npm start                    # Metro dev server
npm run ios                  # iOS simulator
npm run android              # Android emulator
npm run web                  # web target

npm run lint                 # expo lint
npx tsc --noEmit             # typecheck
npm test                     # jest

npm run verify               # the full gate (lint + typecheck + test)
npm run deploy:check         # post-push deploy gate (stub today)

npm run deploy:preview       # EAS preview build (Android APK)
npm run deploy:production    # EAS production build (all platforms)
```

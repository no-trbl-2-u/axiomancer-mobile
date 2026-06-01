# Axiomancer — Mobile Client

Expo / React Native client for the Axiomancer TTRPG. This repo is the
**presentation layer** only. Game rules, state shape, and randomness
live in the
[`axiomancer-mechanics`](https://www.npmjs.com/package/axiomancer-mechanics)
engine, which this app consumes as a library.

If you are looking for "how does combat work" or "what does an effect
do", read the engine. If you are looking for "what does the combat
screen show in the `choosing_stance` phase", read this repo.

Durable mobile architecture and product decisions live in
[`docs/adr/`](./docs/adr/). These records sit above build-plan execution
and below T's latest explicit decision / company CDRs.

---

## Quick start

```bash
npm install
npm start              # Metro dev server
npm run ios            # iOS simulator
npm run android        # Android emulator
npm run web            # web target
```

You will need the Expo CLI installed; on first run, install Expo Go
or build a development client.

## Scripts

| Script              | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `npm start`         | Start Metro dev server.                                      |
| `npm run ios`       | Start the iOS simulator.                                     |
| `npm run android`   | Start the Android emulator.                                  |
| `npm run web`       | Start the web target.                                        |
| `npm run web:container` | Start Expo web inside a `node:20-alpine` container (port 18081 by default). Used for the AI screenshot walkthrough below. |
| `npm run web:container:wait` | Block until the containerised dev server responds with HTTP 200. |
| `npm run web:container:down` | Stop and remove the container. |
| `npm run lint`      | `expo lint` (ESLint with Expo's config).                     |
| `npx tsc --noEmit`  | Type-check.                                                  |
| `npm test`          | Run Jest (requires Spec 01 setup first). |

## Deploy environment

This repo does not auto-deploy from `main`. Native builds are produced on
demand by [EAS Build](https://docs.expo.dev/build/introduction/) (Expo's
cloud build service); the `deploy:*` scripts are thin wrappers that load
`.env` and shell out to the `eas` CLI.

One-time setup on a fresh checkout:

```bash
cp .env.example .env          # populate, then edit
npm install -g eas-cli        # if you don't already have it
eas login                     # one-time browser auth
```

Set these vars in `.env` (all listed in `.env.example`):

| Var                | Required for                      | Where to get it                                       |
| ------------------ | --------------------------------- | ----------------------------------------------------- |
| `EXPO_TOKEN`       | `deploy:preview`, `deploy:production`, `deploy:check` polling | https://expo.dev/settings/access-tokens (scopes: `builds:read`, `projects:read`) |
| `EAS_PROJECT_ID`   | optional — EAS CLI auto-detects from `app.json` | `eas project:info` |
| `DEPLOY_PROVIDER`  | switch `deploy:check` between real polling (`eas`) and stub (`none`, default) | choose per environment |

Running a build:

```bash
npm run deploy:preview        # verify gate + eas build android --profile preview
npm run deploy:production     # verify gate + eas build --platform all --profile production
```

Both scripts run `npm run verify` first; a red verify gate blocks the
build before any cloud minutes are consumed. The `with-env.mjs` wrapper
exists because npm does not auto-load `.env`, but `eas build` needs
`EXPO_TOKEN` visible in its environment.

After pushing to `main`, the shipping skills (`/ship-a-phase`,
`/iterate`) call `npm run deploy:check` to confirm a build exists for the
pushed commit. With `DEPLOY_PROVIDER=none` (the default), this is a stub
that prints HEAD and exits per the contract documented in
`scripts/deploy-check.mjs`:

```
exit 0  →  deploy ready (artifact uploaded)
exit 1  →  deploy errored / failed
exit 2  →  timeout / no build matched commit yet
exit 3  →  config / auth (EXPO_TOKEN missing or rejected)
```

When you set `DEPLOY_PROVIDER=eas` and provide `EXPO_TOKEN`, the same
script polls the EAS Build API for the build matching the current HEAD
commit and returns the real exit code.

## Project layout

```
app/                       expo-router routes
  _layout.tsx              root stack + font loader
  index.tsx                redirects to /exploration
  (tabs)/                  five-tab shell
    _layout.tsx            tab bar config
    combat.tsx             combat screen (placeholder UI)
    character.tsx          character sheet (placeholder UI)
    exploration.tsx        map / node graph (placeholder UI)
    inventory.tsx          inventory screen (placeholder UI)
    event.tsx              event / boss encounter (placeholder UI)
components/                reusable presentational components
  StanceGlyph.tsx          heart / body / mind glyphs (SVG placeholders)
  EffectGlyph.tsx          buff / debuff glyphs
  ActionIcon.tsx           sword / shield / etc. icons
  StatBar.tsx              HP / mana progress bar
  EffectChip.tsx           buff/debuff chip with icon + label
  …                        see folder
theme/                     palette + font tokens
  axm.ts                   AXM.* colours + FONTS.* family names
assets/                    images + fonts (mostly empty placeholders)
specs/                     planning specs — start at specs/README.md
docs/                      design notes
  testing.md               hermetic e2e testing standard (REQUIRED)
  prompts/                 AI-assist prompt templates
SVG_ASSET_SPEC.md          contract for replacing every placeholder SVG
```

## Architecture

```
┌────────────────────────────┐
│        UI screens          │  app/(tabs)/*.tsx
│ (read view-models, render) │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│       Presenters           │  app/<route>/*.engine.ts
│  (pure: state → ViewModel) │  ← hermetic e2e lives here
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│       Engine store         │  state/store.ts (Spec 02)
│   (Zustand-backed wrapper  │
│    around createGameStore) │
└──────────────┬─────────────┘
               │
               ▼
┌────────────────────────────┐
│   axiomancer-mechanics     │  npm package — engine
│   (rules, RNG, reducers)   │
└────────────────────────────┘
```

Read upward, mutate downward. The screens never reach past the
presenter; the presenter never mutates state. Presenters are the
hermetic-e2e contract — that's where the testing standard lives.

## AI workflow

This repo uses a structured spec-driven workflow optimised for AI-
assisted development. Pick up the loop here:

- **First time?** [`AGENTS.md`](./AGENTS.md) — orientation for
  Cursor / Claude Code agents.
- **Picking up work?** [`specs/README.md`](./specs/README.md) — the
  recommended order. **Spec 01 is a hard prerequisite** for every
  other spec.
- **Planning a change?** [`specs/00-how-to-use-specs.md`](./specs/00-how-to-use-specs.md)
  — the operator's manual.
- **Writing tests?** [`docs/testing.md`](./docs/testing.md) — hermetic
  e2e standard. Every implementation must land with at least one.

## Hermetic E2E testing

Every implementation lands with at least one hermetic e2e test that
drives the change through the highest-level public entry point of
its module — typically a presenter (`select<Screen>ViewModel`) or
the engine store lifecycle (`createGameStore(memoryAdapter, …)`).

**Hermetic** = self-contained (no network / no real `AsyncStorage` /
no real timers / no real fonts) + deterministic (`Math.random`
stubbed) + isolated (`afterEach(() => jest.restoreAllMocks())`).

See [`docs/testing.md`](./docs/testing.md) for the full standard.
The harness itself ships with [`specs/01-test-harness-setup.md`](./specs/01-test-harness-setup.md).

## Theme

Dark-only by design. Tokens in `theme/axm.ts`:

| Token           | Hex        | Use                              |
| --------------- | ---------- | -------------------------------- |
| `AXM.bg`        | `#0a0a0a`  | near-black background            |
| `AXM.parchment` | `#e8dfc8`  | main text / inactive icon        |
| `AXM.blood`     | `#c0152a`  | HP, danger, bleed                |
| `AXM.sulfur`    | `#d4c026`  | mana, selected, active           |
| `AXM.rust`      | `#9e3a1a`  | friendship, rust accents         |
| `AXM.bone`      | `#8a8273`  | secondary text, inactive tabs    |
| `AXM.ash`       | `#3a3530`  | borders, disabled                |

Fonts:

- **Pirata One** — gothic display headers.
- **IM Fell English** — body serif (with italic variant).
- **Bebas Neue** — sans labels (button captions, section labels).
- **JetBrains Mono** — numerics (HP / damage / rolls).

## AI screenshot walkthrough

Claude Code can drive a real browser against the running app and take
screenshots — useful for "see what the user sees" regression checks
before shipping a screen change.

Wiring:

- [`.mcp.json`](./.mcp.json) declares a project-local
  [`@playwright/mcp`](https://github.com/microsoft/playwright-mcp)
  server (`chromium`, `--headless`, `--isolated`). Claude Code loads
  it automatically when started in this repo.
- [`scripts/dev-server-container.sh`](./scripts/dev-server-container.sh)
  spins up Expo web inside a throw-away `node:20-alpine` container so
  the host doesn't accumulate Metro state between sessions.

One-time setup on a fresh checkout:

```bash
npx playwright install chromium   # ~170 MB, downloads the browser binary
```

Per-walkthrough flow:

```bash
npm run web:container             # starts container on http://127.0.0.1:18081
npm run web:container:wait        # blocks until the bundler is serving HTTP 200
# (Claude calls browser_navigate / browser_take_screenshot / browser_resize)
npm run web:container:down        # tear down when done
```

Mobile viewports live as inline args to the Playwright MCP — switch
between `Pixel 7` (412 × 915) and `iPhone 14` (390 × 844) by calling
`browser_resize` mid-walkthrough.

Native (Android emulator + `adb screencap`) is not wired in this pass;
web coverage catches most regressions.

## SVG assets

Every SVG in this codebase is a coded placeholder. The swap contract
lives in [`SVG_ASSET_SPEC.md`](./SVG_ASSET_SPEC.md) and is executed
by [`specs/11-asset-pipeline.md`](./specs/11-asset-pipeline.md).

## License

TBD. Ask the project maintainer.

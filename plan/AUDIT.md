# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

> Bias: memoir-surface (set via `/oversight` 2026-05-16 after
> critique pass 7 surfaced 4 MED findings clustered on
> `state/presenters/memoir.engine.ts` +
> `app/(tabs)/memoir/index.tsx` — same shape as the
> event-surface cluster that followed the Phase 32 port).
> `/iterate` weights cluster members 1.5× until the surface
> drains: the 4 MED rows (JSDoc stale, `emptyMoral` /
> `emptyPhilosophical` unconsumed, PARLEYED-WITH-for-flee
> re-voice to FLED per oversight 2026-05-16, and the Phase 33
> shipped-state body SACK → SATCHEL fix) plus the LOW
> `'untested.'` chip-vs-narrative split. Once those rows
> close, bias resets and `/iterate` resumes natural HIGH-first
> ordering across the remaining queue (smoke-screens memoir
> route + SACK docs sweep). Prior event-surface bias closed
> 2026-05-16 after 3 of 4 cluster rows drained
> (HIGH event.tsx chrome `994fb02`, MED ENCOUNTER dedup
> `11c47db`, LOW empty-state voice `d6bf779`); the 4th cluster
> row (LOW STRIFE STIRS) is moving to Done as
> `[accepted-as-design]` per oversight 2026-05-16.

## Top 5 findings (scored) — 2026-05-13 (stale; archived below)

### [3.8] Drain 8 lint warnings (unused imports + stale eslint-disable) — picked

- issue: #11
- category: tests (quality / verify-gate noise)
- impact: 4 (warnings are non-fatal but mask real signal; the
  audit log explicitly tracks the count "7 pre-existing" → now
  8, and unchecked warnings drift upward)
- ease: 9.5 (every warning is an import-list trim or a one-line
  delete; mechanical, no behaviour change)
- next: edit `app/(tabs)/character/index.tsx`,
  `app/(tabs)/event.tsx`, `app/_layout.tsx`,
  `components/ActionIcon.tsx`, `components/BodyDiagram.tsx`,
  `components/NodeMark.tsx`; run `npm run verify`; commit

### [3.0] Migrate `Consumable.effectId` from string parsing to structured `healAmount: number` ✅

- issue: #12 (closed by commit `a5438c5`)
- category: refactor / data (engine integration debt)
- **Resolved 2026-05-13.** Mobile now reads `consumable.healAmount`
  directly; legacy `effectId: 'Heal N HP'` strings stay supported
  via `parseHealAmount` for backward compat. Caught a latent
  double-heal bug along the way — the engine's `store.useConsumable`
  already applies `healAmount` internally via `useConsumableEffect`,
  so the mobile-side `healCharacter` call now gates to the
  legacy-string path only. See commit `a5438c5`.

### [2.5] `state/presenters/navigation.engine.ts` carries 3 TODOs blocked on engine surface

- category: refactor / external-dependency
- impact: 5 (active events, XP/level-up, event-state checks all
  fall back to defaults — Phase 8 navigation polish is shipped
  but these stubs are silent dead ends once engine Spec 09 land)
- ease: 5 (waits on engine surface; tracked in the
  `[needs-user-call]` Phase 6 row below)
- next: defer — same blocker as Phase 6

### [2.0] `state/mocks/combat.skills.fixture.ts` still mocks skills (engine Spec 04)

- category: refactor / data
- impact: 5 (combat surface reads mocked skills; engine Spec 04
  shipped but the mobile mock was never migrated to engine
  selectors — drift risk)
- ease: 4 (need to wire engine skill selectors into the combat
  presenter and delete the fixture)
- next: future tick — sized like a small refactor, not a
  one-tick fix

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) — RESOLVED ✅

- Resolved 2026-05-15 — Phase 6 shipped. See Done section for details.

## Pending

### [3.5] `components/ScreenBg.tsx` has no colocated test coverage

- category: tests
- impact: 5 (universal screen wrapper used by every tab — wraps
  children in SafeAreaView + AXM.bg fill, with a `scrollable`
  prop that branches between ScrollView vs fixed View. Silent
  drift could break scrolling on screens that rely on the
  default-true behavior or push content under the system bar.)
- ease: 7 (pure presentation, single prop branch)
- next: add `components/__tests__/ScreenBg.test.tsx` — renders
  children; scrollable=true (default) renders a ScrollView;
  scrollable=false renders a fixed View; bottom-pad sentinel
  only mounts in the scrollable branch
- source: iterate audit 2026-05-21

## Done

### [4.5] Drain 32 lint warnings introduced by Phase 60f + Phase 61 ✅
- Resolved 2026-05-21 (commit `ab2c0d7`). `npm run lint --
  --fix` across 16 files removed ~25 unused
  `eslint-disable-next-line` directives + 4 `ReadonlyArray<T>`
  → `readonly T[]` style fixes. Lint 0 warnings (was 32);
  tsc clean; jest 853/853 unchanged.

### [3.2] `components/MindMark.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `fb83c43`). Added 6 hermetic cases
  pinning the null-render branch (default / explicit 0 /
  negative) and the badge render branch (SVG circles + 'MARK ×N'
  text reflects stacks). 853/853 green at land (+6 over 847).

### [3.6] `components/NodeMark.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `806a0c4`). Added 7 hermetic cases
  pinning kind → SVG branch (skull / X / sulfur ring /
  parchment ring) and the size-prop passthrough across every
  kind. 847/847 green at land (+7 over 840).

### [3.2] `components/EffectGlyph.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `82f3314`). Added 10 hermetic
  cases pinning kind → SVG branch resolution (one per known
  kind, asserts Path count) and default-case fallback to a
  styled placeholder View. 840/840 green at land (+10 over
  830).

### [3.5] `components/AftermathBanner.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `cd7ddfc`). Added 10 hermetic
  cases pinning render shape (eyebrow/title/subtitle/rewards
  conditional, testID), accessibility (live region, label,
  announce one-shot), and the auto-dismiss timer (default
  2500ms, custom displayMs, unmount cleanup). 830/830 green
  at land (+10 over 820).

### [3.2] `components/FriendshipMeter.tsx` colocated test coverage ✅
- Resolved 2026-05-21 (commit `ebd1fe1`). Added 9 hermetic cases
  pinning heart count, fill semantics, counter text, and the
  compact label-toggle. 820/820 green at land (+9 over 811).

### [3.5] `components/EffectChip.tsx` colocated test coverage ✅

- Resolved 2026-05-21 (commit `ec927b7`). Added
  `components/__tests__/EffectChip.test.tsx` with 11 hermetic
  cases pinning color-map, tint-map, duration / intensity
  conditional rendering, and the dim opacity branch. 811/811
  green at land (+11 over 800).

### [Done 2026-05-20] `axiomancer-mechanics@0.10.2` adopted; surface drift drained ✅

- category: external-dependency (engine package)
- source: cross-repo versioning audit (integrated 2026-05-15)
- **Resolved 2026-05-20** with Phase 60f (commit `a6cd028`).
  The engine published 0.10.2 mid-cycle with 9 breaking surface
  changes (`getCoastalMap` removed; `Encounter.enemy` → `enemies[0]`;
  `DialogueChoice` / `DialogueNode` flattened; `Character.mana`
  removed; `ActiveEffect` shape change + latent `composeHazard` bug;
  `GameStore` ↔ `AppStoreState` strictness; `EffectStatTarget`
  literal union; `MobileNotificationsSlice` `toast` required;
  `GameState` lost string index signature). Mobile migrated the
  drift across **Phases 60a–60f**: 60a (`baf66fa`), 60d (`579a6a7`),
  60b (`0ee7f63`), 60c (`7e29be5`), 60e (`8596409`), 60f
  (`a6cd028`). Lockfile pin now at 0.10.2; verify gate green at
  760/760. Upgrade doc at `docs/engine-upgrade-0.10.0-to-0.10.2.md`.
- handoff doc: [`docs/engine-team-handoff-2026-05-16.md`](../docs/engine-team-handoff-2026-05-16.md)
  (historical context for the original three engine asks; all
  resolved at engine Phase 50 / GH#64 closing comment).

### [needs-user-call] Phase 32 — port-commit ambiguity RESOLVED ✅
- Resolved 2026-05-16 via `/oversight`. The prior oversight pass
  filed this row when the user thought a port commit had landed
  under a different name but the loop couldn't locate it. Since
  then, commit `ff37b46`
  ("feat: tabs + event combat-prelude — port from the design
  handoff") landed as the canonical Phase 32 port, and
  `08bcf5e` shipped its `spec32 tick A` presenter follow-up.
  Phase 32's detect-and-defer dispatch rule now has a real
  reference point; no more ambiguity. Row closed.

### [paused] Phase 33 — MEMOIR tab paused after ticks A + B — RESUMED ✅
- Filed 2026-05-16 via `/oversight` after the user paused
  Phase 33 mid-flight (ticks A `6515cb5` + B `2f70eac` shipped;
  C alignment + D chronicle remained). Resumed 2026-05-16 via a
  later `/oversight` pass: the paused note is removed from the
  build plan, Phase 33's row goes back to active `[ ]`, and
  `/march` picks Phase 33 up again on the next tick.

### [9.5] Tab labels rendering as `{ TAB NAME }"--index"` literally ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick B (commit `ab9f646`).
  Source `_layout.tsx` already carried correct strings; defensive
  fix layered two contracts: `TAB_TITLES` presenter constant
  (state/presenters/tabs.engine.ts) + explicit `tabBarLabel:` on
  every `<Tabs.Screen>` (the documented expo-router escape
  hatch). Strings later flipped to the all-places register via
  Phase 31 (`542f7c9` — `WILDS · STRIFE · SELF · SACK`). Live
  tab-bar verification waits on the next manual EAS preview
  build.

### [9.0] Combat encounter screen is rendering blank ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick C (commit `fb53af0`).
  The `!vm.isInCombat` loading branch returned an empty
  `<View />` placeholder; replaced with visible
  `<Text>{vm.loadingMessage}</Text>` rendering 'the field
  stirs.' (lowercase ritual, uppercased via `textTransform`).
  Tick C added the loadingMessage field to CombatViewModel +
  populated both code paths + pinned the contract with a
  hermetic test. Verify 410/410.

### [9.0] Character tab is crashing on the deployed build ✅
- category: tests / bug
- source: user report during oversight 2026-05-16
- **Resolved 2026-05-16** via Phase 30 Tick A (commit `5e24706`).
  Diagnosed by the new smoke-render harness on its first run:
  `useGameState(selectCharacterViewModel)` was churning
  `useSyncExternalStore` because the presenter returned a
  frozen-new object every call (same pattern previously fixed
  in event screen). Refactored to slim-slice
  `useGameState((s) => s.player)` + `useMemo` the VM. Verify
  401/401 at Tick A close.

### [voice] Revise `app/(tabs)/combat.tsx:122` — "Thy hands are empty." → no second-person archaic pronouns ✅

- category: voice (bearings compliance)
- source: oversight 2026-05-15; bumped 2026-05-15
- issue: #38
- **Resolved 2026-05-15.** `setToast('Thy hands are empty.');` → `setToast('Hands are empty.');` per the original /oversight option-description. Verify green at 357/357. Closes #38. See commit `85e9078`.

### [design-source] Token Crucible (commit `261a238`) — design lives in Claude Design ✅

- category: process (loop visibility)
- source: `/oversight` 2026-05-15
- **Resolved 2026-05-15.** User confirmed the Token Crucible design (and the broader upstream design source for handoffs like it) lives in **Claude Design** at: <https://claude.ai/design/p/019e0f5a-a0f0-753b-be1e-8939e6011384>. Reference added to `plan/bearings.md` under "External services". Future `feat: <X> — port from design handoff` commits should land alongside a candidate row before shipping, and `/plan-a-phase` reads this URL when a design handoff is referenced.

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) — RESOLVED ✅

- **Resolved 2026-05-15.** Phase 6 shipped end-to-end across
  four sub-tick commits: `2c4d2b0` (presenter + store slice),
  `31e42f0` (action layer), `beba7d4` (screen refactor),
  `87d0b4c` (close-out). The five product questions were
  already answered in the spec body (A / C / B / Future spec /
  Yes); the `[skipped]` rationale was stale and got flipped
  via `/oversight` earlier today. Spec 08 marked DONE at H1.
  Verify green at 321/321.



### [3.5b] Visual-smoke pipeline — `smoke-screens.mjs` + baseline workflow ✅

- proposed: 2026-05-15 (shipped silently in commit `796d7b7`
  "Add smoke" before being tracked here — filed retroactively
  via `/oversight` 2026-05-15 per user direction)
- category: tests (coverage gap — visual regression, sibling
  to the [3.5] bundler smoke)
- impact: 4 (catches rendered-output regressions the bundler
  smoke can't see: layout shifts, asset drift, theme breakage;
  works hand-in-hand with the export-time smoke from [3.5])
- ease: 4 (Playwright-driven; baseline-approve flow + diff
  artefacts; opt-in like its bundler-smoke sibling)
- **Resolved 2026-05-15.** Two-part landing in commit `796d7b7`:
  - **(script)** `scripts/smoke-screens.mjs` (350 lines) drives
    `expo export --platform web` then snapshots a configured
    screen list, comparing against committed
    `screenshots/baseline/*` PNGs. `scripts/baseline-approve.mjs`
    promotes `screenshots/current/` over the baselines after
    review.
  - **(test)** `scripts/__tests__/smoke-screens.test.ts` (180
    lines) covers the hermetic helpers (argument building, diff
    classification, exit-code contract).
  - **(.gitignore)** `screenshots/baseline/` committed; ephemeral
    `screenshots/current/`, `screenshots/diff/`, `.smoke-dist/`
    ignored (this commit).
- residual / follow-ups (iterate-shaped, not blocking):
  - Not yet wired into `.github/workflows/verify.yml` —
    Playwright + a real export is heavier than the [3.5] bundler
    smoke; CI wiring deserves its own audit row if/when needed.
  - Baseline coverage starts small (see
    `screenshots/baseline/README.md` for the seeded surface list).

### [3.5] Add a bundler smoke test (boot Expo + curl `/` + assert 200) ✅

- proposed: 2026-05-14, filed via `/oversight` from user note
  `missing-e2e.md` (now archived into this finding)
- category: tests (coverage gap — environmental, not unit)
- impact: 5 (today's hermetic Jest suite cannot detect Metro /
  Expo bundler regressions: favicon/manifest middleware,
  filesystem-cache permission failures, asset-pipeline breakage.
  The next time the bundler fails to boot, nothing flags it
  before a user hits the symptom — exactly how the
  2026-05-14 `EACCES` cache-dir incident surfaced)
- ease: 4 (small Node script + CI workflow; needs to run
  outside Jest because Metro spawns its own workers)
- source signal: `missing-e2e.md` user note (archived into this
  row 2026-05-14 — original file deleted from working tree)
- **Resolved 2026-05-15.** Two-part landing:
  - **(script + hermetic test)** `scripts/smoke-bundler.mjs`
    runs `expo export --platform web` against a tmp output dir,
    then asserts `index.html` lands with a non-trivial byte
    count. Exit contract mirrors `deploy-check.mjs` (0 ok /
    1 failed / 2 timeout / 3 config). Hermetic helpers
    (`buildExportArgs`, `classifyExportResult`) covered by
    `scripts/__tests__/smoke-bundler.test.ts`. Wired as an
    opt-in `npm run smoke:bundler` — deliberately not part of
    `pnpm verify` because a real export takes 30–60 s.
  - **(CI wiring)** `.github/workflows/verify.yml` runs both
    `npm run verify` and `npm run smoke:bundler` (with an
    8-minute timeout via `SMOKE_BUNDLER_TIMEOUT_MS`) as parallel
    jobs on every push to `main` and every PR against `main`.
    Optional follow-up the loop cannot do itself: turn the
    `verify` job into a required status check via branch
    protection (Settings tab).

### [3.8] Drain 8 lint warnings (unused imports + stale eslint-disable) ✅

- **Resolved 2026-05-13.** See commit `5c32f87` (issue #11).
  Trimmed unused `ScrollView`, `Defs`, `RadialGradient`, `Stop`,
  `Line` (×2), `G` imports across the 5 component / screen
  files; removed the now-stale `// eslint-disable-next-line
  no-console` in `app/_layout.tsx:48`. `npm run verify` clean
  (lint 0/0, typecheck clean, 209/209 tests pass).

### [needs-user-call] Confirm hosting / deploy contract ✅

- **Resolved 2026-05-13.** User provisioned `.env` (gitignored,
  verified) with `EXPO_ID` + `EXPO_TOKEN`. The `EXPO_ID`
  (`9c04…`) matches the `projectId` already hardcoded in
  `app.json:59` under `extra.eas.projectId`, so the build will
  resolve the right EAS project. `EXPO_TOKEN` is what
  `eas build` reads for non-interactive auth.
- `package.json` already wires the deploy gate:
  `deploy:preview` runs `verify` (currently green, 185/185)
  then `eas build --platform android --profile preview`
  against the `preview` profile in `eas.json` (Android APK,
  internal distribution).
- **Residual work (non-blocking, not user-gated):**
  (1) the `eas build` invocation needs `EXPO_TOKEN` exported
  in the shell — `.env` isn't auto-loaded by npm scripts.
  Either prefix with `dotenv -e .env --` or document the
  `export $(grep -v '^#' .env | xargs)` recipe in the runbook.
  (2) Phase 11 (asset-pipeline) is the natural home for the
  written runbook + CI secret mirror. Queue for `/iterate`.
- The loop is now safe at **L2+** for the deploy gate.

### [HIGH] Verify gate is RED — engine API drift from latest mechanics bump ✅

- **Resolved 2026-05-13.** Renamed `effect → effectId` on every
  `Consumable` literal in
  `state/actions.ts:550`,
  `state/presenters/inventory.modal.engine.ts:81`, and the three
  failing fixtures (`state/e2e/inventory.engine.test.ts`,
  `state/e2e/inventory.modal.engine.test.ts`,
  `state/e2e/inventory.screen.test.tsx`). Added
  `rarity: 'common'` + `requiredLevel: 1` to every `Equipment`
  literal in the same three fixtures.
- `npm run verify`: lint clean (7 pre-existing unused-import
  warnings, 0 errors), typecheck clean, **185 / 185 tests pass**.
- Note: the audit framed this as "mechanical renames," and it
  was — but `Consumable.effectId` is *semantically* an ID
  reference, not a free-form description. We're currently
  stuffing strings like `'Heal 6 HP'` into it so the existing
  `parseHealAmount` string-parser keeps working. A follow-up
  pass should migrate to the structured `healAmount?: number`
  field (and likely `inlineEffect?: Effect`) that the new
  mechanics package exposes. Flagged for a future `/iterate`
  pick-up — not blocking.

### [needs-user-call] Confirm canonical project name + tagline ✅

- **Resolved 2026-05-13** via defensible-default acceptance.
  Canonical name is **"Axiomancer Mobile"** (matches
  `package.json` `"name": "axiomancer-mobile"` and existing
  prose in README/specs). No code change required. Tagline
  remains the README's existing one-liner ("Expo / React Native
  client for the Axiomancer TTRPG") until product asks for
  something marketing-shaped.
- If you want a different public name, say so and I'll thread
  it through `package.json`, README, and `app.json`.

### [needs-user-call] Confirm GitHub PAT scope for `/triage` ✅

- **Resolved 2026-05-13** via defensible-default acceptance:
  do nothing for now. `/triage` exits cleanly when `GH_TOKEN`
  is unset, so the loop is safe. Re-open this item when you
  actually want `/triage` to start labeling issues; the recipe
  is unchanged (fine-grained PAT with Issues:RW + Metadata:R on
  `no-trbl-2-u/axiomancer-mobile`, set `GH_TOKEN` + `GH_REPO`
  in `.env`).

### [low] README references missing companion docs ✅

- **Resolved 2026-05-13.** Removed the three broken pointers
  (`Knowledge-Gaps.md`, `BRAINDUMP.md`, `GAME-ROADMAP.md`) from
  `README.md`. If you want any of those docs authored later,
  re-open as its own item — I didn't speculate about content
  the user hasn't asked for.

### [low] Spec 07 (Exploration) shipped but not flipped `[DONE]` ✅

- **Resolved 2026-05-13.** Added `[DONE on 2026-05-13 — see
  commit 06fc907]` under the H1 in
  `specs/07-exploration-screen-wiring.md`, matching the
  convention used in Spec 06.

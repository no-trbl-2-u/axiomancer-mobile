# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

> Bias: critique/comprehension (set via oversight 2026-05-15;
> self-expired 2026-05-15 — all three named rows drained: see
> `plan/CRITIQUE.md` Done).

## Top 5 findings (scored) — 2026-05-13

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

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) blocked on engine Spec 09 + narrative contract

- See Pending below — unchanged.

## Pending

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

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) blocked on five open product questions

- category: external-dependency / build-plan
- impact: 4 (Phase 6 is mid-stack but its blocker doesn't gate
  Phases 7–13; the loop routes around)
- ease: 3 (engine half is now done — only product calls remain)
- next: **user action required (product, not engine)** — the
  engine half closed in `axiomancer-mechanics@0.6.0`:
  `createGameStore` exposes `moveToNode(nodeId)`,
  `processNode()`, and `applyDialogue(tree, choice)` on
  `GameActions` (see
  `node_modules/axiomancer-mechanics/dist/Game/store.d.ts`),
  on top of the existing `ProcessNodeResult` / `ProcessedEvent`
  / `MapEvent` / `UniqueEvent` / `DialogueTree` /
  `applyDialogueChoice` surface. `activeEvent` /
  `resolveEvent` / `EventChoice[]` remain **illustrative**
  names — the mobile presenter has to compose them from
  `ProcessNodeResult` and the current dialogue node. Un-skip
  Phase 6 after the five product questions in
  `specs/08-event-screen-wiring.md` are answered.
- in the meantime: Phase 6's row is marked `[skipped]` in
  `plan/steps/01_build_plan.md`; the autonomous loop routes
  to Phase 7 (Spec 09 — AsyncStorage persistence) and beyond.
  See `plan/phases/phase_6_event_screen_wiring.md` for the
  blocker brief and the three resolution paths (answer the
  questions, defer, or stub-ship — the loop *chose not to*
  stub-ship).
- engine-side resolution (2026-05-15): mechanics bumped from
  0.4.x → 0.6.0; package.json pinned to `"latest"` so future
  bumps land automatically. Verify gate green at 260/260
  after the bump.

## Done

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

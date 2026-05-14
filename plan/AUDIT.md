# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

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

### [needs-user-call] Phase 6 (Spec 08 — Event screen wiring) blocked on engine Spec 09 + narrative contract

- category: external-dependency / build-plan
- impact: 4 (Phase 6 is mid-stack but its blocker doesn't gate
  Phases 7–13; the loop routes around)
- ease: 2 (requires engine **Spec 09** orchestration / store wiring
  and/or a published package bump the autonomous loop cannot
  author alone)
- next: **user action required** — `axiomancer-mechanics@0.4.1`
  does not expose a mobile-trivial “pending narrative + resolve
  choice” slice (`activeEvent` / `resolveEvent` / `EventChoice[]`
  are **illustrative** names from the mobile spec, not real
  exports). **What *does* ship today (engine Spec 08, done):**
  `moveToNode`, `processNode`, `ProcessNodeResult` / `ProcessedEvent`,
  `MapEvent` / `UniqueEvent`, `completeUniqueEvent`, branching NPC
  dialogue via `DialogueTree` + `applyDialogueChoice` (see mechanics
  `docs/world.md`). **`createGameStore` gap (engine Spec 09):** the
  public store still does not wrap world movement / `processNode` /
  dialogue picks — the Event tab cannot match the combat-tab pattern
  until orchestration + product contract land. Bump or monorepo
  link when Spec 09 ships; un-skip Phase 6 after the contract is
  pinned **and** the five product questions in
  `specs/08-event-screen-wiring.md` are answered.
- in the meantime: Phase 6's row is marked `[skipped]` in
  `plan/steps/01_build_plan.md`; the autonomous loop routes
  to Phase 7 (Spec 09 — AsyncStorage persistence) and beyond.
  See `plan/phases/phase_6_event_screen_wiring.md` for the
  blocker brief and three resolution paths (bump, defer, or
  stub-ship — the loop *chose not to* stub-ship).
- additional user-call: even after the engine + store wiring
  land, mobile Spec 08's five open questions are all unanswered
  in `specs/08-event-screen-wiring.md`. Those are product calls.

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

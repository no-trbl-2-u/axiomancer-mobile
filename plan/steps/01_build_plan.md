# 01 — Build plan

> Style guardrails for every phase below. Always ship hermetic
> Jest tests alongside code — never "add tests later". Break
> work into small, focused components in folders. Pure helpers
> (presenters, store adapters) go in their own modules with
> their own tests. Prefer 5 small files with clear names over 1
> dense file. Engine logic stays in `axiomancer-mechanics`.

## Status (at-a-glance)

`/march`, `/ship-a-phase`, and (transitively) `/loop` read this
block to find the next phase. Format: `[ ]` pending → `[x]`
shipped (with commit hash). Tick in this file in the same
commit that ships the phase.

**Already shipped (pre-loop, prior history):**

- [x] Spec 01 — Test harness setup (`jest-expo` +
      `@testing-library/react-native`, hermetic-test standard
      in `docs/testing.md`). See `specs/01-test-harness-setup.md`
      `[DONE on 2026-05-11]`.
- [x] Spec 02 — Engine store integration (Zustand store wrapping
      `createGameStore`; `<GameStoreProvider>`, `useGameState`,
      `useGameActions`, typed action wrappers). See
      `specs/02-engine-store-integration.md` `[DONE on
      2026-05-11 — see commit efef5f5]`.
- [x] Spec 04 — Combat screen wiring (canonical sibling for
      every later screen-wiring phase). See
      `specs/04-combat-screen-wiring.md` `[DONE on 2026-05-12]`.
- [x] Spec 06 — Inventory screen wiring. See
      `specs/06-inventory-screen-wiring.md` `[DONE on 2026-05-13]`.
- [x] Spec 07 — Exploration screen wiring. Implementation
      landed in commit `06fc907` ("Exploration spec
      implementation"); spec doc flipped to `[DONE on 2026-05-13]`
      in commit `527f021` as part of phase 2's audit close-out.

**Next up (autonomous loop's queue):**

- [x] Phase 1 — Adopt nexus methodology. Shipped in commit
      `a703908` ("chore: adopt nexus methodology"); closed out
      in this commit.
- [x] Phase 2 — Fix engine API drift (verify-gate unblocker).
      Shipped in commit `527f021` ("Fix audit issues"); see
      `plan/phases/phase_2_engine_drift.md` for the retroactive
      brief. Verify gate is GREEN (185 / 185).
- [x] Phase 3 — Spec 02: Engine store integration. Shipped in
      commit `efef5f5` ("Engine store integration") on
      2026-05-11; see `plan/phases/phase_3_engine_store_integration.md`
      for the retroactive brief.
- [ ] Phase 4 — Spec 03: Presenter layer. Lock the
      `select<Screen>ViewModel(state) → ViewModel` contract for
      every screen; codify the pattern that Spec 04 + 06
      already exemplify.
- [ ] Phase 5 — Spec 05: Character screen wiring (presenter
      + view-model + hermetic e2e + view shell).
- [ ] Phase 6 — Spec 08: Event screen wiring (depends on
      engine spec 09 — see carry-overs).
- [ ] Phase 7 — Spec 09: `AsyncStorage` persistence adapter.
      Coordinates with the engine's storage spec.
- [ ] Phase 8 — Spec 10: Navigation + app-shell polish (deep
      links, back behaviour, tab badges, splash → first screen
      handoff).
- [ ] Phase 9 — Spec 11: Asset pipeline. Drain the SVG
      placeholder backlog via the existing
      `.cursor/skills/swap-asset-placeholder/SKILL.md` flow.
      One real asset per tick.
- [ ] Phase 10 — Spec 12: Accessibility + theming polish
      (a11y labels, reduce-motion, font-scaling, large-text,
      dark-only confirmation).
- [ ] Phase 11 — EAS Build deploy-gate wiring. Replace the
      stub in `scripts/deploy-check.mjs` with a real EAS Build
      API poll (`https://api.expo.dev/v2/projects/<id>/builds`)
      keyed to HEAD's commit SHA. Document `EXPO_TOKEN` setup
      in `setup/02_eas.md` (new file).
- [ ] Phase 12 — App icon + splash screen polish (final assets,
      adaptive icons, splash background = `AXM.bg`).
- [ ] Phase 13 — TestFlight + Play Internal Track first cut.
      Production EAS builds, store listings drafted, internal
      testers invited.

> **After phase 13:** the loop transitions to `/iterate` —
> bug findings, presenter refactors, asset backlog, ongoing
> audits. `/march` makes that transition automatic.

> **Note on the deploy gate before phase 11 ships:** auto-deploy
> is **not** a thing for this project. `npm run deploy:check` is
> a stub that exits 0 with a notice. The shipping skills still
> call it as Step 12 so the contract stays uniform.

---

## Per-phase scope

Each row above corresponds to one phase. The detailed brief
lives at `plan/phases/phase_<N>_<topic>.md`. If a brief is
missing when the loop reaches its phase, the loop generates one
from the scope below + the matching `specs/NN-*.md` document.

### Phase 1 — Adopt nexus methodology

Land the nexus overlay (`agents.md`, `plan/`, `skills/`,
`.claude/`, `scripts/deploy-check.mjs`, `.env.example`) without
touching `app/`, `components/`, `state/`, or any other product
code. Detailed brief: `plan/phases/phase_1_bootstrap.md`.

### Phase 2 — Fix engine API drift (verify-gate unblocker)

Inserted at adoption time because `npm run verify` is RED on
the current `main`. The most recent commit (`845a4a7`,
"Install latest mechanics package") bumped
`axiomancer-mechanics` past a breaking API change without
migrating callers:

- `Consumable.effect` → `Consumable.effectId`
- `Equipment` now requires `rarity` and `requiredLevel`

Files to migrate:

- `state/actions.ts:550` — rename `.effect` to `.effectId`
  (or the equivalent lookup, depending on how the consumable
  resolves).
- `state/e2e/inventory.engine.test.ts` — fixtures at lines 42,
  48, 58: rename + add the two missing required fields.
- `state/e2e/inventory.modal.engine.test.ts` — fixtures at
  lines 42, 46, 84.
- `state/e2e/inventory.screen.test.tsx` — fixtures at lines 66,
  70.

For `rarity` / `requiredLevel` defaults, check the engine's
`Equipment` type definition in
`node_modules/axiomancer-mechanics` for the enum / numeric
range; pick conservative defaults (`rarity: "common"`,
`requiredLevel: 1`) and note the call in the commit body.

`pnpm test` should be green twice + `npx tsc --noEmit` clean
before flipping the row. Move the `[HIGH]` AUDIT entry to
"Done".

### Phase 3 — Spec 02: Engine store integration

Pull `createGameStore` from `axiomancer-mechanics`. Wrap it in
a `zustand` store at `state/store.ts`. Provide a
`GameStoreProvider` and per-screen selectors. Migrate one
screen as a proof (combat already works against the new
contract — use it as the sibling). Detailed brief generated by
`/plan-a-phase` from `specs/02-engine-store-integration.md`.

### Phase 4 — Spec 03: Presenter layer

Lock the `select<Screen>ViewModel(state, t) → ViewModel`
contract. Document in `docs/presenters.md`. Land hermetic e2e
infra under `state/e2e/`. Detailed brief generated from
`specs/03-presenter-layer.md`.

### Phase 5 — Spec 05: Character screen wiring

Apply the canonical-sibling pattern from Spec 04:
`character.engine.ts` (pure), `character.tsx` (view shell),
hermetic e2e at `state/e2e/character.engine.test.ts`,
`character.copy.ts` for strings. Brief from
`specs/05-character-screen-wiring.md`.

### Phase 6 — Spec 08: Event screen wiring

Same shape. Depends on engine spec 09 ("quests / events" in
`axiomancer-mechanics`) — confirm engine support before
starting; if absent, file a `[needs-engine]` row in `AUDIT.md`
and pivot to phase 6. Brief from `specs/08-event-screen-wiring.md`.

### Phase 7 — Spec 09: AsyncStorage persistence

Add an `AsyncStorage` adapter that satisfies the engine's
storage interface. Wire `GameStoreProvider` to rehydrate on
mount + persist on every transition. Hermetic e2e against a
memory adapter; integration against a stub `AsyncStorage`.
Brief from `specs/09-asyncstorage-persistence.md`.

### Phase 8 — Spec 10: Navigation + app shell polish

Deep links (Expo Router config), back-behaviour audit, tab
badges (e.g., new event indicator), splash → first screen
handoff sans flicker. Brief from
`specs/10-navigation-and-app-shell.md`.

### Phase 9 — Spec 11: Asset pipeline

Drain the SVG placeholder backlog one asset at a time per
`.cursor/skills/swap-asset-placeholder/SKILL.md`. Each tick
ships one real asset + its size variants + its swap commit.
This is the natural transition point to `/iterate` once the
other screen phases are done. Brief from
`specs/11-asset-pipeline.md`.

### Phase 10 — Spec 12: Accessibility + theming polish

`accessibilityLabel` audits, `accessibilityRole`, reduce-motion
respect, font-scaling sanity, large-text support, dark-only
confirmation. Brief from
`specs/12-accessibility-and-theming.md`.

### Phase 11 — EAS Build deploy gate wiring

Replace the `scripts/deploy-check.mjs` stub with a real EAS
Build API poll. Add a `setup/02_eas.md` runbook covering the
EXPO_TOKEN scopes, the `EAS_PROJECT_ID` lookup, the polling
budget, and the failure-mode contract. Verify with one
deliberately broken deploy + one good deploy.

### Phase 12 — App icon + splash screen polish

Final adaptive icons (foreground / background per Android
spec), iOS app icon, splash background = `AXM.bg`, splash
logotype in Pirata One. Asset swap follows the standard
contract.

### Phase 13 — TestFlight + Play Internal Track first cut

Production EAS builds, store listing drafts, screenshots from
the simulators, internal testers invited. The end of the
substrate; `/iterate` takes over after.

---

## Carry-overs / known gaps (update as phases ship)

- **`docs/presenters.md`** exists but pre-dates the presenter
  contract lock — phase 3 rewrites it.
- **No `setup/` runbooks yet.** Phase 10 (EAS) and a
  follow-up GitHub runbook are queued; until then,
  `agents.md` "Operational secrets" is the canonical config
  doc.

## Phase log (commit hashes)

- phase 1 — a703908 — adopt nexus methodology overlay (substrate;
  no product code changes)
- phase 2 — 527f021 — engine API drift fix (effect → effectId on
  Consumable; rarity + requiredLevel on Equipment fixtures;
  verify gate green at 185 / 185)
- phase 3 — efef5f5 — engine store integration (Spec 02;
  GameStoreProvider, useGameState, useGameActions, typed action
  wrappers, hermetic e2e harness)

# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.
>
> First pass has not yet run — the rows below are
> `[needs-user-call]` items the nexus-adoption commit logged
> for the user to resolve before the loop ratchets up past
> level 0.

## Pending

### [HIGH] Verify gate is RED — engine API drift from latest mechanics bump

- category: engine-bridge / tests
- impact: 10 (blocks every autonomous tick; loop is at L0 until
  fixed)
- ease: 7 (mechanical renames + add two required fields to test
  fixtures)
- next: Phase 2 — open `state/actions.ts` and the three failing
  test files (`state/e2e/inventory.engine.test.ts`,
  `state/e2e/inventory.modal.engine.test.ts`,
  `state/e2e/inventory.screen.test.tsx`); rename `effect →
  effectId` on every `Consumable` literal; add
  `rarity: <pick>` + `requiredLevel: <pick>` to every
  `Equipment` literal. Confirm `npm run verify` is green twice
  before flipping the build-plan row. See commit `845a4a7`
  ("Install latest mechanics package") for the drift's origin.

### [needs-user-call] Confirm hosting / deploy contract

- category: external-service
- impact: 6 (the deploy gate is a stub until this is resolved;
  loop is safe at L0–L1, **not** L2+ until then)
- ease: 3 (requires `EXPO_TOKEN` + `EAS_PROJECT_ID` + a written
  runbook; queued as phase 11)
- next: user provides EXPO_TOKEN scopes + confirms the EAS
  project ID via `eas project:info`, or schedules phase 11 to
  derive both. No code change needed yet.

### [needs-user-call] Confirm canonical project name + tagline

- category: branding
- impact: 3 (no public-facing surface yet)
- ease: 9 (one decision)
- next: confirm "Axiomancer Mobile" is the public name (vs.
  "Axiomancer" without the platform qualifier). Defensible
  default while unresolved: "Axiomancer Mobile" as used in
  `package.json` and existing docs.

### [needs-user-call] Confirm GitHub PAT scope for `/triage`

- category: external-service
- impact: 4 (the loop currently does no triage, so this is dead
  weight until `/triage` runs)
- ease: 9 (one PAT, one .env line)
- next: user issues a fine-grained PAT with Issues:RW +
  Metadata:R on `no-trbl-2-u/axiomancer-mobile`, sets
  `GH_TOKEN` + `GH_REPO` in `.env`. Defensible default: do
  nothing; `/triage` exits clean when `GH_TOKEN` is missing.

### [low] README references missing companion docs

- category: docs / content-gaps
- impact: 3
- ease: 8
- next: either author `Knowledge-Gaps.md`, `BRAINDUMP.md`, and
  `GAME-ROADMAP.md` (the README links them as if they exist),
  or remove the broken pointers. `/iterate` pick-up.

### [low] Spec 07 (Exploration) shipped but not flipped `[DONE]`

- category: process / docs
- impact: 2
- ease: 9
- next: open `specs/07-exploration-screen-wiring.md`, mark
  `[DONE on YYYY-MM-DD — see commit 06fc907]`, link the commit.
  `/iterate` or `/oversight` pick-up.

## Done

(empty — first pass has not run)

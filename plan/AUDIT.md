# Site audit

> Latest findings from `/iterate audit`. Rewritten on each
> audit pass. The Pending list at the bottom queues `/iterate`.

## Pending

### [needs-user-call] Confirm hosting / deploy contract

- category: external-service
- impact: 6 (the deploy gate is a stub until this is resolved;
  loop is safe at L0–L1, **not** L2+ until then)
- ease: 3 (requires `EXPO_TOKEN` + `EAS_PROJECT_ID` + a written
  runbook; queued as phase 11)
- next: **user action required** — provide an `EXPO_TOKEN`
  scoped for EAS Build/Submit and confirm the EAS project ID
  (`eas project:info`). Until both land in `.env` / CI secrets,
  do not promote the loop past L1. No code change is queued;
  phase 11 (asset-pipeline) will derive the runbook once
  credentials exist.

## Done

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

# Engine upgrade brief — `axiomancer-mechanics@0.7.0` → `0.9.0`

> Prep work for the version bump. Written 2026-05-19 at commit
> `0b0f688`. The actual `pnpm install axiomancer-mechanics@0.9.0`
> is the user's call — this brief just makes it a one-liner.

## TL;DR

- **Status: ready to bump.** Only one breaking change in the public
  surface affected mobile (`WorldMap` → `MapState`); pre-applied in
  this same prep commit. Both names still exist in 0.7.0, so the
  rename is a no-op until the version bump actually lands.
- **No new mobile work required** to land 0.9.0. The bump is a
  one-line edit to `package.json`.
- **Three handoff items still not resolved in 0.9.0.** Phase 16 / 20
  / 21 remain `[needs-engine-release]`. The bump does not unblock
  them.

## What 0.9.0 adds (additive, low-risk)

| Surface | Kind | Mobile uses it? |
|---|---|---|
| `buyItem`, `sellItem` | function | No — shop screen not built yet |
| `selectCritDamage` | function | No |
| `unlockAdjacent` | function | No (mobile uses `revealAdjacent`) |
| `ShopWare`, `ShopInventory` | type | No |
| `dist/Items/types.d.ts` emission | build fix | No direct consumer |

## What 0.9.0 removes (the only breaking change)

| Surface | Replacement | Mobile sites | Pre-flight status |
|---|---|---|---|
| `type WorldMap` (top-level) | `type MapState` | `state/actions.ts` (2), `state/e2e/exploration.engine.test.ts` (1) | **Renamed in this commit.** Verified type-check + impacted tests still pass at 0.7.0. |

Structurally identical — the engine's internal types always referenced
`MapState`; `WorldMap` was a top-level alias and got dropped.

## What 0.9.0 does NOT address

Three handoff items from
[`docs/engine-team-handoff-2026-05-16.md`](../docs/engine-team-handoff-2026-05-16.md)
are still open against 0.9.0:

| Item | Status against 0.9.0 | Blocks mobile |
|---|---|---|
| 1. Top-level `skillLibrary` / `getSkillById` re-export | ✗ still undefined at top | Phase 16, 20, 21 |
| 2. `dist/<sub>/types.d.ts` emission (was 0 of 9) | ~ 1 of 9 fixed (`Items/`); 8 still missing | Same phases |
| 3. `PersistenceAdapter` ergonomics | unknown — re-check after bump | Lower priority; local shim works |

Verification commands (sanity-check after bump):

```bash
# Item 1 — top-level skillLibrary
node -e "const m=require('axiomancer-mechanics'); console.log(typeof m.skillLibrary, typeof m.getSkillById)"
# expected after fix: "object function"
# observed in 0.9.0: "undefined undefined"

# Item 2 — dist types.d.ts presence
for sub in Skills Effects Combat Character Enemy Items World NPCs Utils; do
  test -f node_modules/axiomancer-mechanics/dist/$sub/types.d.ts \
    && echo "✓ $sub" || echo "✗ $sub"
done
```

The local handoff body at `/tmp/engine-handoff-body.md` is still the
current text for the engine-repo issue. Status of that filing remains
**not filed** (cross-repo `gh issue create` is classifier-gated from
this loop).

## The actual bump procedure

When ready to flip:

```bash
# 1. Bump the pin (still exact)
pnpm add axiomancer-mechanics@0.9.0
# or hand-edit package.json: "axiomancer-mechanics": "0.9.0"

# 2. Verify gate
pnpm exec tsc --noEmit
pnpm test
pnpm exec eslint . --max-warnings=0

# 3. Re-check handoff items (item 1 sanity above)
# 4. If green: commit + push.
```

The `WorldMap` → `MapState` rename in this commit is the only
pre-bump migration needed. Everything else is additive.

## Rollback

If the bump exposes a runtime issue not caught by the test suite:

```bash
pnpm add axiomancer-mechanics@0.7.0
```

— and revert the `package.json` line. The `WorldMap` → `MapState`
rename in this commit is forward-compatible (both names exist in
0.7.0), so the rename does NOT need to revert with the version.

## Open follow-ups after the bump

- Phase 50 (cold-codex) is the next queued shipping phase, unrelated.
- Phase 16 / 20 / 21 stay `[needs-engine-release]` until items 1+2
  are addressed by the engine team. Re-check on every `pnpm install`
  per `plan/AUDIT.md` Pending row.
- File the engine-team handoff issue manually when ready:

```bash
gh issue create --repo no-trbl-2-u/axiomancer-mechanics \
  --title "Three asks from the mobile (axiomancer-mobile) consumer" \
  --body-file /tmp/engine-handoff-body.md \
  --label "external/mobile-consumer"
```

/**
 * Combat codex presenter — Phase 50 tick B (cold-codex chrome).
 *
 * Pure helpers consumed by `app/(tabs)/combat.tsx` when
 * `useAesthetic()` returns `'codex'`. The canonical render stays
 * untouched; these helpers compose codex-specific display strings
 * from the existing `CombatViewModel` so the screen branches on
 * VM-derived strings, not raw engine state (Hard Rule #8).
 *
 * Design source: `design/handoff-2026-05-16/project/app.jsx`
 * `function ScreenStrifeCodex` — the bone-and-ash chrome variant
 * for high-stakes screens (chat2 "Open caveats").
 */

import type { CombatViewModel } from './combat.engine';
import { toRomanLower } from './roman';

/**
 * Codex slug for the enemy name. Lowercases and replaces hyphens
 * + whitespace with dots so multi-word names render as
 * `larch.stalker` (matches the design source's ENC= token format).
 */
export function selectCodexEnemySlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[\s_-]+/g, '.')
        .replace(/[^a-z0-9.]/g, '')
        .replace(/\.+/g, '.')
        .replace(/^\.|\.$/g, '');
}

/**
 * The mono status line that sits at the top of the codex combat
 * screen, e.g. `ENC=larch.stalker · ROUND=iv · STATE=choosing_action`.
 * Round renders as a roman lower numeral (matches the design
 * source); phase is the engine state key as-is.
 *
 * When `vm.isInCombat` is false (e.g. transitional render before
 * the mock encounter starts), the strip falls back to placeholder
 * tokens rather than throwing — the design source pins the strip
 * as always-present chrome on the codex screen.
 */
export function selectCodexStatusLine(vm: CombatViewModel): string {
    const enc = vm.isInCombat ? selectCodexEnemySlug(vm.enemy.name) : 'none';
    const round = toRomanLower(vm.round);
    return `ENC=${enc} · ROUND=${round} · STATE=${vm.phase}`;
}

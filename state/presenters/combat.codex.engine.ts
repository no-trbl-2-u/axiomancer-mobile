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

/**
 * Roman-numeral table used by the codex status strip. Capped at x;
 * past ten the strip falls back to the decimal. Identical bound to
 * the event-side helper (`state/presenters/event.engine.ts`).
 */
const ROMAN_LOWER_CODEX: readonly string[] = [
    '', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x',
];

function toRomanLowerCodex(n: number): string {
    if (!Number.isFinite(n) || n <= 0) return 'i';
    if (n < ROMAN_LOWER_CODEX.length) return ROMAN_LOWER_CODEX[n];
    return String(n);
}

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
    const round = toRomanLowerCodex(vm.round);
    return `ENC=${enc} · ROUND=${round} · STATE=${vm.phase}`;
}

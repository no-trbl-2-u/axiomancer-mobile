/**
 * Phase 70 Tick A — aftermath presenter.
 *
 * Composes the view model that `<CombatVictoryPanel>` (and, in later
 * ticks, `<CombatFriendshipPanel>` / `<CombatDefeatPanel>`) consumes
 * to render the in-encounter-modal aftermath. The combat slice is
 * cleared at the moment combat exits (`actions.endCombat()` fires
 * before this VM is built), so the presenter reads from the
 * `AftermathData` snapshot stashed on the `combat-mode` provider
 * instead — see `state/combat-mode.tsx`.
 *
 * Discriminated-union VM keyed by `kind`. Tick A populates the
 * `'victory'` branch only; the other branches are typed but unused
 * until later ticks. The view-side mount only renders the panel
 * matching the VM's `kind`, so the empty branches don't surface as
 * dead UI.
 *
 * Per Hard Rule #8 — no display literals at the view layer. The
 * `finalBlowPhrase` chronicle flavour line is selected here, keyed
 * off the damage tier. Three placeholder variants (brutal / quiet /
 * ironic) ship as a presenter-local lookup; engine-side flavour
 * generation is a Phase 70 follow-up if the writers want to
 * generate per-enemy lines.
 */

import type { AftermathData } from '@/state/combat-mode';

/**
 * Loot tile rendered in the spoils list. Tick A keeps this shape
 * minimal — Tick B / C may extend (icon hint per slot, rarity tier
 * color, etc.) but the basics (name + slot + rarity) cover the
 * design's `RarityRail` + `ItemGlyph` rendering.
 */
export interface AftermathLootEntry {
    name: string;
    slot: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'unique';
}

/**
 * Currency reward strip cell. Tick A ships placeholder values (the
 * engine doesn't surface combat currency yet) — the field stays
 * nullable so the panel can collapse the strip when there's nothing
 * to render.
 */
export interface AftermathCurrency {
    vitae: number;
    sigils: number;
}

export interface AftermathRewards {
    xp: number | null;
    currency: AftermathCurrency | null;
    loot: AftermathLootEntry[];
}

export interface AftermathVictoryViewModel {
    kind: 'victory';
    /** Display name in gothic caps (already uppercased upstream). */
    enemyName: string;
    /** Italic serif epithet (short phrase, no period). Nullable —
     *  the engine's `Enemy.description` field is a sentence, not an
     *  epithet; the presenter picks the first clause as a best-effort
     *  epithet, returning null when no usable text is found. */
    enemyEpithet: string | null;
    finalBlow: { skillName: string; damage: number; descriptor: string } | null;
    finalBlowPhrase: string;
    rewards: AftermathRewards;
}

/**
 * Optional journal-entry card surfaced under the reward strip on
 * the friendship panel. Engine doesn't yet expose per-foe codex
 * entries, so this stays null in Tick B; the panel collapses the
 * section. Bundle shape per
 * `design/handoff-2026-05-22/project/screens/aftermath-modal.jsx:454-458`.
 */
export interface AftermathJournalEntry {
    bookName: string;
    entryTitle: string;
    /** First sentence-or-so of the entry, no trailing ellipsis (the
     *  panel adds it). */
    preview: string;
}

export interface AftermathParleyViewModel {
    kind: 'parley';
    enemyName: string;
    enemyEpithet: string | null;
    /**
     * One-line chronicle phrase rendered in italic under the pixel
     * emblem. Presenter-selected from a small variant table keyed
     * off enemy "softness" (currently a coarse heuristic on level —
     * lower-level foes lay down quiet; higher-level foes set things
     * down before yielding). The engine doesn't currently surface
     * per-foe pact lines.
     */
    pactPhrase: string;
    rewards: {
        xp: number | null;
        /** Currency reads the same rust accent as the pact emblem; the
         *  field stays null until engine integration. */
        currency: AftermathCurrency | null;
        loot: AftermathLootEntry[];
    };
    journalEntry: AftermathJournalEntry | null;
}

export interface AftermathDefeatViewModel {
    kind: 'defeat';
    enemyName: string;
    enemyEpithet: string | null;
}

export type AftermathViewModel =
    | AftermathVictoryViewModel
    | AftermathParleyViewModel
    | AftermathDefeatViewModel;

/**
 * Build the aftermath VM from the snapshot stashed at combat-exit
 * time. Returns `null` when the snapshot is null (no aftermath to
 * render) or its variant doesn't yet have a Tick A render path.
 *
 * Tick A: only `'victory'` returns a populated VM. The `'parley'`
 * and `'defeat'` branches return null (the legacy `<AftermathBanner>`
 * still handles parley until Tick B; defeat is silent until Tick C).
 */
export function selectAftermathViewModel(
    data: AftermathData | null,
): AftermathViewModel | null {
    if (data === null) return null;
    if (data.variant === 'victory') {
        return {
            kind: 'victory',
            enemyName: data.enemy.name.toUpperCase(),
            enemyEpithet: deriveEpithet(data.enemy.description),
            finalBlow: deriveFinalBlow(data),
            finalBlowPhrase: deriveFinalBlowPhrase(data),
            rewards: {
                xp: data.xpReward,
                currency: null,
                loot: [],
            },
        };
    }
    if (data.variant === 'parley') {
        return {
            kind: 'parley',
            enemyName: data.enemy.name.toUpperCase(),
            enemyEpithet: deriveEpithet(data.enemy.description),
            pactPhrase: derivePactPhrase(data),
            rewards: {
                xp: data.xpReward,
                currency: null,
                loot: [],
            },
            journalEntry: data.journalEntry,
        };
    }
    // Defeat ships in Tick C.
    return null;
}

/**
 * Pull a short epithet out of the enemy description. The engine's
 * `Enemy.description` is a full sentence (e.g., "A figure long since
 * gnawed by the road's hunger."); we lift the part *after* the first
 * verb-phrase as a rough epithet ("long since gnawed by the road's
 * hunger"). When no usable text is found, return null so the panel
 * skips the epithet line entirely.
 *
 * Heuristic — not a parser. Good enough to fill the line on a vast
 * majority of enemies; for the rest, the line collapses gracefully.
 */
function deriveEpithet(description: string): string | null {
    if (description.length === 0) return null;
    // Strip leading "A " / "An " / "The " and trim to the first ~40
    // chars at a word boundary. The result reads as a fragment, which
    // matches the design's intent (italic serif fragment under the
    // enemy name).
    const stripped = description
        .replace(/^(A |An |The )/, '')
        .replace(/\.$/, '')
        .toLowerCase();
    if (stripped.length === 0) return null;
    if (stripped.length <= 40) return stripped;
    const cutoff = stripped.lastIndexOf(' ', 40);
    return cutoff > 0 ? stripped.slice(0, cutoff) : stripped.slice(0, 40);
}

function deriveFinalBlow(
    data: Extract<AftermathData, { variant: 'victory' }>,
): AftermathVictoryViewModel['finalBlow'] {
    if (data.finalBlow === null) return null;
    return {
        skillName: data.finalBlow.skillName ?? 'STRIKE',
        damage: data.finalBlow.damage,
        descriptor: data.finalBlow.descriptor ?? 'felled the foe',
    };
}

/**
 * Pick a chronicle-flavour final-blow phrase keyed off the damage
 * tier. Three variants from the bundle's tone reference — terse,
 * past-tense, concrete nouns. The damage tier is the only signal
 * we have at presenter time; richer signals (enemy archetype,
 * stance triangle, philosophical alignment) would require engine
 * integration and are out of scope for Tick A.
 */
function deriveFinalBlowPhrase(
    data: Extract<AftermathData, { variant: 'victory' }>,
): string {
    const damage = data.finalBlow?.damage ?? 0;
    if (damage >= 20) {
        // Brutal — the foe goes down hard.
        return `and the ${data.enemy.name.toLowerCase()} went down face-first into its own teeth.`;
    }
    if (damage >= 10) {
        // Quiet — the foe falls in a measured way.
        return `it folded into itself, twice, the way a wet rag folds.`;
    }
    // Ironic — the foe falls almost by accident.
    return `it set the bell down, slow. the bell did not ring. the wet ground took the rest.`;
}

/**
 * Pick a chronicle pact phrase keyed off enemy level. Coarse
 * heuristic — lower-level foes yield quietly, higher-level foes
 * give up a thing of theirs (a bell, a sigil, a held breath). Three
 * variants from the bundle's tone reference, all third-person past,
 * concrete nouns. Engine-side per-foe pact lines are a Phase 70
 * follow-up if the writers want to author them.
 */
function derivePactPhrase(
    data: Extract<AftermathData, { variant: 'parley' }>,
): string {
    const level = data.enemy.level;
    if (level <= 2) {
        // Quiet yield — the foe simply stops.
        return `it stopped, then lowered its long face against the wet ground.`;
    }
    if (level <= 5) {
        // The foe sets a thing down (the bundle's exemplar phrase).
        return `it set down the bell, slow, and laid its long face against the wet ground.`;
    }
    // Heavy yield — the foe gives up a held thing.
    return `it held out the bell, mouth-down, so it would not sound. then it knelt.`;
}

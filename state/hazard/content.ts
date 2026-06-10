/**
 * Hazard Minigame v2 — authored content.
 *
 * Card and reward data is a faithful port of the design-handoff
 * prototype (`hazard-proto-engine.jsx`). Route thresholds are RETUNED
 * for the no-re-cast dice doctrine (the prototype assumed a fresh cast
 * every round; this build rolls 4 dice once per hazard) — tuning
 * evidence lives in `state/hazard/__tests__/balance.sim.test.ts` and
 * the rationale in `docs/hazard-balance-recommendations.md`.
 */

import type {
    HazardCardDef,
    HazardConsequenceId,
    HazardDef,
    HazardDieKind,
    HazardKeywordId,
    HazardProgressKey,
    HazardRewardId,
} from './types';

// ---------------------------------------------------------------------------
// Keyword glossary (tap-to-read detail)
// ---------------------------------------------------------------------------

export const HAZARD_KEYWORDS: Record<HazardKeywordId, { name: string; desc: string }> = {
    surge: { name: 'SURGE', desc: 'Drop a matching-colour die on this card for its stronger, lower effect.' },
    force: { name: 'FORCE', desc: 'Brawn against the rock — fills the FORCE meter.' },
    escape: { name: 'ESCAPE', desc: 'Speed across the gap — fills the ESCAPE meter.' },
    convert: { name: 'CONVERT', desc: 'Turn hostile ✕-dice into usable mana dice of this card’s colour.' },
    draw: { name: 'DRAW', desc: 'Pull more cards into your hand — more ways to cross.' },
    recast: { name: 'RE-CAST', desc: 'Re-roll all your unspent dice into fresh faces.' },
    gilded: { name: 'GILDED', desc: 'Gold cards are rare and strong — but only a GOLD die can power them.' },
    crack: { name: 'CRACK', desc: 'Dead weight. This card does nothing and cannot be powered. It only clogs your hand.' },
};

// ---------------------------------------------------------------------------
// The draw deck. kind = colour. f/e = FREE values; fp/ep = SURGE values.
// weight = relative frequency in the starter draw bag.
// ---------------------------------------------------------------------------

export const HAZARD_DECK: HazardCardDef[] = [
    // RED — force
    { id: 'steps', name: 'STONE STEPS', kind: 'red', rarity: 'common', weight: 3, f: 3, e: 0, fp: 6, ep: 1, flavor: 'Kick footholds into the failing rock.', keywords: ['force', 'surge'] },
    { id: 'haul', name: 'DEAD-MAN HAUL', kind: 'red', rarity: 'common', weight: 3, f: 4, e: 1, fp: 7, ep: 1, flavor: 'Drag yourself up by rope and will.', keywords: ['force', 'surge'] },
    { id: 'grip', name: 'IRON GRIP', kind: 'red', rarity: 'uncommon', weight: 2, f: 5, e: 0, fp: 9, ep: 0, flavor: 'Hands like a closing vise.', keywords: ['force', 'surge'] },
    { id: 'quarry', name: 'QUARRY-SIGN', kind: 'red', rarity: 'uncommon', weight: 2, f: 0, e: 0, effect: 'convert', flavor: 'Mark the stone; it answers in kind.', keywords: ['convert', 'surge'] },

    // BLUE — escape
    { id: 'scram', name: 'SCRAMBLE', kind: 'blue', rarity: 'common', weight: 3, f: 0, e: 3, fp: 1, ep: 6, flavor: 'Half-fall, half-fly across the gap.', keywords: ['escape', 'surge'] },
    { id: 'runner', name: 'CLIFFRUNNER', kind: 'blue', rarity: 'common', weight: 3, f: 1, e: 4, fp: 1, ep: 7, flavor: 'Momentum is the only thing holding you up.', keywords: ['escape', 'surge'] },
    { id: 'leap', name: 'FAITH LEAP', kind: 'blue', rarity: 'uncommon', weight: 2, f: 0, e: 5, fp: 0, ep: 9, flavor: 'Close your eyes. Trust the far side.', keywords: ['escape', 'surge'] },
    { id: 'scout', name: 'SCOUT AHEAD', kind: 'blue', rarity: 'uncommon', weight: 2, f: 0, e: 0, effect: 'draw', drawBase: 1, drawPowered: 3, flavor: 'Send your eyes ahead of your feet.', keywords: ['draw', 'surge'] },

    // PURPLE — mid both (one tilts force, one tilts escape, one even)
    { id: 'footing', name: 'SURE FOOTING', kind: 'purple', rarity: 'common', weight: 3, f: 2, e: 2, fp: 4, ep: 4, flavor: 'Read the ledge before you trust it.', keywords: ['surge'] },
    { id: 'pole', name: 'BALANCE POLE', kind: 'purple', rarity: 'common', weight: 2, f: 3, e: 1, fp: 5, ep: 3, flavor: 'Weight in both hands, breath in the middle.', keywords: ['surge'] },
    { id: 'windread', name: 'READ THE WIND', kind: 'purple', rarity: 'common', weight: 2, f: 1, e: 3, fp: 3, ep: 5, flavor: 'Let the valley tell you when to move.', keywords: ['surge'] },
    { id: 'wind', name: 'SECOND WIND', kind: 'purple', rarity: 'uncommon', weight: 2, f: 0, e: 0, effect: 'recast', flavor: 'Shake the dice loose. Breathe. Begin again.', keywords: ['recast', 'surge'] },

    // GOLD — strong both, rare, gold die only
    { id: 'oath', name: 'UNBROKEN OATH', kind: 'gold', rarity: 'rare', weight: 1, f: 3, e: 3, fp: 8, ep: 8, flavor: 'You will not fall. You refuse.', keywords: ['gilded', 'surge'] },
    { id: 'blessing', name: "PILGRIM'S BLESSING", kind: 'gold', rarity: 'rare', weight: 1, f: 4, e: 4, fp: 7, ep: 7, flavor: 'Something older than the cliff steadies you.', keywords: ['gilded', 'surge'] },
];

/**
 * Consequence CRACK card — shuffled into the persistent deck by the
 * `deadcard` consequence. Dead: no values, never powerable.
 */
export const HAZARD_CRACK_CARD: HazardCardDef = {
    id: 'crack', name: 'CRACK', kind: 'purple', rarity: 'common', f: 0, e: 0, fp: 0, ep: 0,
    dead: true, flavor: 'The flaw travels with you now.', keywords: ['crack'],
};

// ---------------------------------------------------------------------------
// Reward-card pool (offered after a clear; picked cards join the deck)
// ---------------------------------------------------------------------------

export const HAZARD_REWARD_CARDS: HazardCardDef[] = [
    { id: 'r_grip', name: 'GREATGRIP', kind: 'red', rarity: 'common', f: 4, e: 0, fp: 7, ep: 1, flavor: 'Hands like vise-iron.', keywords: ['force', 'surge'] },
    { id: 'r_wind', name: 'TAILWIND', kind: 'blue', rarity: 'common', f: 0, e: 4, fp: 1, ep: 7, flavor: 'The valley breathes you onward.', keywords: ['escape', 'surge'] },
    { id: 'r_even', name: 'EVENKEEL', kind: 'purple', rarity: 'uncommon', f: 3, e: 3, fp: 5, ep: 5, flavor: 'Neither rushed nor rooted.', keywords: ['surge'] },
    { id: 'r_conv', name: 'HEX-BREAKER', kind: 'purple', rarity: 'uncommon', f: 0, e: 0, effect: 'convert', flavor: 'Unmake the hostile die.', keywords: ['convert', 'surge'] },
    { id: 'r_oath', name: 'UNBROKEN OATH', kind: 'gold', rarity: 'rare', f: 3, e: 3, fp: 8, ep: 8, flavor: 'You will not fall. You refuse.', keywords: ['gilded', 'surge'] },
    { id: 'r_crown', name: 'CROWN RELIC', kind: 'gold', rarity: 'rare', f: 5, e: 5, fp: 9, ep: 9, flavor: 'A king died wearing this on a worse ledge.', keywords: ['gilded', 'surge'] },
];

export function getHazardCardDef(cardId: string): HazardCardDef {
    const def =
        HAZARD_DECK.find((c) => c.id === cardId) ??
        HAZARD_REWARD_CARDS.find((c) => c.id === cardId) ??
        (cardId === HAZARD_CRACK_CARD.id ? HAZARD_CRACK_CARD : undefined);
    if (!def) throw new Error(`Unknown hazard card id: ${cardId}`);
    return def;
}

// ---------------------------------------------------------------------------
// Boon / consequence catalogues
// ---------------------------------------------------------------------------

export const HAZARD_REWARDS: Record<HazardRewardId, { name: string; icon: string; desc: string }> = {
    cache: { name: 'Shrine Cache', icon: 'chest', desc: 'A sealed cache of relics and coin from across the split. +12 shillings.' },
    relic: { name: 'Bonus Relic', icon: 'relic', desc: 'A rare relic — risk-route exclusive. +20 shillings.' },
    vitae: { name: 'Restored Vitae', icon: 'heart', desc: 'Recover 6 Vitae as the danger passes.' },
    token: { name: 'Paradox Token', icon: 'paradox', desc: '+1 banked Paradox token for your next combat.' },
};

export const HAZARD_CONSEQUENCES: Record<HazardConsequenceId, { name: string; icon: string; desc: string }> = {
    tokens: { name: 'Sundered', icon: 'tokens', desc: 'Lose all banked Paradox & Fallacy tokens.' },
    deadcard: { name: 'Dead Weight', icon: 'deadcard', desc: 'A useless CRACK card is shuffled into your deck.' },
    maxhp: { name: 'Scarred', icon: 'maxhp', desc: '−5 Maximum Vitae until you next rest at an inn.' },
    minhp: { name: 'Bleeding', icon: 'minhp', desc: 'Lose 8 Vitae immediately.' },
    curse: { name: 'Hexed', icon: 'curse', desc: 'Begin your next combat with a hostile Curse die.' },
};

/** Vitae restored by the `vitae` reward. */
export const HAZARD_VITAE_REWARD = 6;
/** Shillings granted by the `cache` reward. */
export const HAZARD_CACHE_SHILLINGS = 12;
/** Shillings granted by the `relic` reward. */
export const HAZARD_RELIC_SHILLINGS = 20;
/** Vitae lost to the `minhp` consequence. */
export const HAZARD_MINHP_LOSS = 8;
/** Maximum-vitae reduction from the `maxhp` consequence. */
export const HAZARD_MAXHP_SCAR = 5;

// ---------------------------------------------------------------------------
// Progress types & die faces
// ---------------------------------------------------------------------------

export const HAZARD_TYPES: Record<HazardProgressKey, { key: HazardProgressKey; label: string }> = {
    force: { key: 'force', label: 'FORCE' },
    escape: { key: 'escape', label: 'ESCAPE' },
};

/** Die faces: the four colours plus two hostile ✕ — 1/3 chance hostile. */
export const HAZARD_DIE_FACES: HazardDieKind[] = ['red', 'blue', 'purple', 'gold', 'hex', 'hex'];

// ---------------------------------------------------------------------------
// Authored hazards.
//
// Thresholds tuned for the no-re-cast doctrine via Monte-Carlo
// simulation (balance.sim.test.ts): one cast of 4 dice must last all
// 3 rounds, so totals sit well below the prototype's per-round values
// (Safe 12/13/14, Risk 7/7→9/10) which assumed a fresh cast each round.
// ---------------------------------------------------------------------------

export const HAZARD_LIBRARY: HazardDef[] = [
    {
        id: 'cracked-cliff',
        title: 'CRACKED CLIFF PATH',
        scenario: 'The ledge fails underfoot. A shrine cache glints across the split.',
        boardHeadline: 'THE SPLIT WIDENS',
        safeBoardNote: 'reach the passage mark to cross',
        riskBoardNote: 'clear both meters to cross',
        safeRouteName: 'LEDGE CRAWL',
        riskRouteName: 'THE LEAP',
        safeRouteDesc: 'One combined meter — any progress counts. Forgiving, but the prize is plain.',
        riskRouteDesc: 'Two meters, both required each round — split your hand between FORCE and ESCAPE.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [19, 21, 23], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[9, 9], [10, 10], [11, 11]], rewardLabel: 'Shrine cache + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'flooded-undercroft',
        title: 'FLOODED UNDERCROFT',
        scenario: 'Black water climbs the crypt stairs. Something below is still breathing.',
        boardHeadline: 'THE WATER RISES',
        safeBoardNote: 'wade the long gallery before it fills',
        riskBoardNote: 'dive the drowned shortcut — both meters',
        safeRouteName: 'THE LONG GALLERY',
        riskRouteName: 'THE DROWNED DOOR',
        safeRouteDesc: 'One combined meter — slow, cold, survivable. The water takes its toll either way.',
        riskRouteDesc: 'Force the door and out-swim the surge. Both meters, every round.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [18, 21, 24], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[8, 10], [9, 11], [10, 12]], rewardLabel: 'Reliquary haul + bonus relic', penaltyVitae: 4 },
    },
    {
        id: 'ashfall-crossing',
        title: 'ASHFALL CROSSING',
        scenario: 'The burning field exhales. Each gust strips the path a little barer.',
        boardHeadline: 'THE ASH FALLS',
        safeBoardNote: 'hold the cinder ridge to the far side',
        riskBoardNote: 'run the ashfall flat — both meters',
        safeRouteName: 'CINDER RIDGE',
        riskRouteName: 'THE ASH RUN',
        safeRouteDesc: 'One combined meter — keep to the high stones and grind it out.',
        riskRouteDesc: 'A dead sprint under falling ash. Both meters, and the last round is the worst.',
        rounds: 3,
        safe: { key: 'safe', dual: false, thresholds: [20, 20, 22], rewardLabel: 'Normal reward', penaltyVitae: 2 },
        risk: { key: 'risk', dual: true, thresholds: [[10, 8], [10, 10], [12, 10]], rewardLabel: 'Ember hoard + bonus relic', penaltyVitae: 4 },
    },
];

export function getHazardDef(hazardId: string): HazardDef {
    const def = HAZARD_LIBRARY.find((h) => h.id === hazardId);
    if (!def) throw new Error(`Unknown hazard id: ${hazardId}`);
    return def;
}

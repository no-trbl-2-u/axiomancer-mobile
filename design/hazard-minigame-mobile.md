# Hazard Minigame Mobile Presentation — Design Brief

> **Design-first phase output.** This document translates the mechanics-repo Hazard Minigame doctrine (CDR-0006) into mobile presentation guidance. The mechanics repo owns rules, state, dice, cards, scoring, and tuning. Mobile owns clarity, touch flow, presenter shape, and player comprehension.

## Source of Truth

Primary mechanics sources consumed for this brief:

- `axiomancer-mechanics/docs/hazard-minigame.md` — CDR-0006 accepted v0 doctrine, full card/hazard content, balance notes.
- `axiomancer-mechanics/docs/hazard-minigame-prd.md` — product requirements and success metrics.
- `axiomancer-mechanics/docs/hazard-minigame-tdd.md` — target engine types, state machine, and integration points.
- `axiomancer-mechanics/docs/hazard-minigame-bdd.md` — behavior-driven scenarios for deterministic tests.
- `axiomancer-mechanics/plan/phases/phase_131_hazard_minigame.md` — implementation-unit breakdown and out-of-scope calls.
- `axiomancer-mechanics/skills/hazard-tuning.md` — balance-loop targets and CLI evidence protocol.
- Current local mechanics code under `src/World/Hazard/` — useful witness, but presently not fully aligned with doctrine.

Mobile must treat the doctrine files as stronger than the current partial engine implementation. If package exports and doctrine conflict, preserve doctrine in UX language and file an engine/package follow-up rather than designing around the weakness.

---

## Executive Summary

### Problem Identified

Mobile currently presents hazards as passive event consequences: warning art, damage/effects, and a single endurance-style choice. That is no longer the intended shape. Hazards are becoming a **Mage Knight-like tactical card-and-dice minigame** where the player chooses a route, manages persistent mana dice, plays action cards, and resolves multiple `O`/`X` rounds before receiving reward or punishment.

### Design Solution Approach

Transform hazards from "accept damage" to "solve the crisis" through:

1. **Readable crisis reveal** — scenario, route choice, reward/risk, and round count are legible before commitment.
2. **Hand-informed route choice** — the player sees 5 action cards before selecting top/bottom route.
3. **Persistent dice board** — 4 mana dice are treated as board objects with visible state across rounds.
4. **Card assembly UI** — top actions are free; bottom actions spend mana and must show affordability.
5. **Round judgment clarity** — every round resolves to `O` or `X`; final score is `count(O) - count(X)`.
6. **Mobile-first compression** — dense tactical information uses progressive disclosure, bottom sheets, and touch-safe targets.

The mobile screen must not obscure the central tension: the dice are finite, the hand is imperfect, and round three comes to collect its debt.

---

## 1. Core Player Flow

### Canon State Sequence

The mobile surface should mirror the mechanics state machine:

1. `reveal` — show hazard card and scenario.
2. `draw` — draw and display 5 action cards.
3. `route-select` — choose top or bottom route after seeing the opening hand.
4. `dice-roll` — roll 4 mana dice after route choice.
5. `round-play` — play cards, spend dice, accumulate progress.
6. `round-resolve` — compare progress to threshold, mark `O` or `X`.
7. `between-rounds` — fire enchantments, expire temporary dice, draw 5 new cards.
8. `complete` — compute final score and apply reward/penalty.

### Mobile Interaction Contract

- The route choice is binding for the whole hazard.
- The player knows their opening hand before route choice.
- The player does **not** know mana dice before route choice.
- Dice roll once for the hazard and persist as board objects.
- Dice do not auto-refresh between rounds.
- Top actions are always playable unless card text says otherwise.
- Bottom actions require visible available mana.
- X dice are blocked unless an X-interaction card or enchantment says otherwise.
- Round outcome is never hidden: `O` and `X` are the verdict.

---

## 2. Terminology Standards

### Canon Terms to Preserve

| Engine / Doctrine Term | Mobile Display | Notes |
|---|---|---|
| Hazard | Hazard | Keep. Player-facing and genre-correct. |
| Hazard card | Hazard | The whole crisis card; avoid overexplaining. |
| Action card | Action Card | Use in tutorial/helper text. Card names can stand alone in play. |
| Mana dice | Mana Dice | Keep; these are board resources. |
| X die | X Die / Blocked Die | Use "Blocked" in helper copy for first-time comprehension. |
| Top route | Safe Route | Easier, lower reward. Label may show "TOP / SAFE" in compact UI. |
| Bottom route | Risk Route | Harder, better reward. Label may show "BOTTOM / RISK" in compact UI. |
| Top action | Free Action | Use "Top" on card face if needed, but "Free" in prompts. |
| Bottom action | Mana Action | Stronger/costly; show cost pips. |
| Stability | Stability | Physical balance, structure, composure. |
| Escape | Escape | Bypass, speed, exit. |
| Supply | Supply | Resources, provisions, materials. |
| Force | Force | Power, endurance, confrontation. |
| Focus | Focus | Card buff mechanic only; **not** a progress type. |
| VITAE | VITAE | Canon resource term. Do not rename to Health. |

### Copy Pattern

- Reveal header: `HAZARD — Cracked Cliff Path`
- Scenario line: `The ledge fails underfoot. A shrine cache glints across the split.`
- Route labels:
  - `SAFE ROUTE — Find footing`
  - `RISK ROUTE — Leap for the cache`
- Round label: `ROUND II / III`
- Resolve text:
  - `ROUND II: O — Cleared 7 / 6 Stability`
  - `ROUND III: X — Needed 8 Stability, reached 5`
- Final text: `FINAL SCORE: +1 (2 O - 1 X)`

Avoid generic win/loss language until final scoring. Hazards are attrition puzzles; partial success matters.

---

## 3. Screen Layout

### High-Level Layout

Use a single dedicated Hazard screen or modal route, not the current event-card shell. The event shell can launch it, but the minigame needs its own tactical surface.

Recommended vertical stack:

1. **Hazard Header** — title, scenario, round pips, route badge.
2. **Requirement Panel** — active route, current progress type(s), threshold, reward/risk affordance.
3. **Mana Board** — 4 persistent dice plus temporary dice if created.
4. **Progress Meter** — current round progress vs threshold.
5. **Action Hand** — horizontally scrollable cards or expandable card tray.
6. **Commit / Resolve Bar** — resolve button, undo-last-play if supported, consequence preview.

### Reveal / Route Select Layout

Before route selection:

- Top: hazard title + scenario.
- Middle: 5-card opening hand preview.
- Bottom: two route cards side by side or stacked:
  - Safe Route: progress type, thresholds, reward, failure penalty.
  - Risk Route: different progress type, thresholds, better reward, harsher failure.

Route cards must show that top and bottom routes are not just different numbers. If both routes appear identical except threshold size, the mobile presentation has failed even if the underlying hazard is valid.

### Round Play Layout

During round play:

- Current threshold stays fixed and visible.
- Progress meter updates immediately after each card play.
- Cards played this round appear in a small played-row ledger.
- Dice states update in place: available, spent, exhausted, locked, preserved, temporary.
- The `RESOLVE ROUND` button is disabled only if the engine disallows resolution; otherwise the player may accept an `X`.

### Complete Layout

Show final result as a score ledger, not a single binary modal:

```text
RESULT
O  O  X
Score: +1
Reward: Normal route reward
Penalty: Final round wound avoided / applied as engine reports
```

If score is positive, show reward grant. If zero or negative, show survival/penalty. For 4-5 round hazards, keep the same ledger shape and let the count speak.

---

## 4. Component Recommendations

### `HazardScreen`

Dedicated route-level container. Reads `activeHazard` from store/presenter once mechanics exposes it.

Responsibilities:

- Select the hazard presenter view-model.
- Render phase-specific subpanels.
- Dispatch hazard actions through store actions only.
- Never compute rules locally.

### `HazardCardPanel`

Displays title, scenario, route identity, round count, and final round warning.

States:

- Reveal mode: both routes visible.
- Active mode: chosen route emphasized; unchosen route collapsed.
- Complete mode: routes hidden behind final ledger unless player expands details.

### `HazardRouteChoice`

Two selectable route panels:

- Safe/top route.
- Risk/bottom route.

Each route panel displays:

- Progress type(s).
- Threshold ladder: e.g. `6 / 6 / 8`.
- Round count.
- Reward.
- Failure penalty.
- Badge: `SAFER` or `BETTER REWARD`.

### `HazardManaBoard`

Dice must look like persistent objects, not transient numbers.

Die visual states:

| State | Visual Treatment |
|---|---|
| `available` | Bright face, raised surface, tappable if cost selection is active. |
| `spent` | Dimmed face, low opacity, diagonal slash or spent ring. |
| `exhausted` | Cracked/blackened face, stronger disabled treatment than spent. |
| `discarded` | Removed from board or shown in tiny expired stack for temporary dice. |
| `locked` | Chain/lock overlay; cannot be converted or spent. |
| `preserved` | Gold/bone rim; carries forward as available. |

Color mapping should reuse AXM tokens and must not rely on color alone. Every die color needs a glyph or pip pattern:

- Red: blade / jagged pip.
- Green: arrow / path pip.
- Blue: eye / wave pip.
- Yellow: ration / sun pip.
- Purple: crescent / curse pip.
- X: black blocked mark, not just gray.

### `HazardProgressMeter`

Displays per-progress-type accumulation.

Single requirement:

```text
Stability 5 / 6
```

Dual requirement:

```text
Escape 5 / 5   Force 3 / 5
```

Dual requirements must clearly show that **both** bars must clear. Do not sum them visually unless the route is the special H07 player-choice case.

### `HazardActionCard`

Card face must expose two actions without becoming tiny scripture.

Recommended card structure:

- Name.
- Verb class icon.
- Top/free action row.
- Bottom/mana action row with cost pips.
- Affordability state:
  - bottom action bright when affordable;
  - dimmed when unaffordable;
  - X-related cards highlight blocked dice they can affect.

Touch model:

- Tap card: expand details.
- Tap top row: play free action.
- Tap bottom row: play mana action if affordable.
- Long press: rules text / class explanation.

### `HazardRoundLedger`

Small row of marks:

```text
Round Marks: O  X  ·
```

- Future rounds use `·`.
- Final round pip has a harder outline.
- Additional-X penalties should show as stacked marks if engine reports them.

---

## 5. Information Hierarchy

### Primary Information

1. Current round requirement.
2. Current progress toward that requirement.
3. Available mana dice.
4. Playable card actions.
5. Round marks (`O`/`X`).

### Secondary Information

1. Route reward / risk.
2. Enchantment zone.
3. Deck/discard counts.
4. Failure mitigation currently armed.
5. Remaining card count in hand.

### Tertiary Information

1. Full card rules text.
2. Complete hazard reward ladder.
3. Deck composition.
4. Debug hand injection.
5. CLI seed / deterministic replay info.

The screen should answer the immediate question first: **what do I need, what can I spend, what can this card do?**

---

## 6. UX Rules for Card Classes

### Direct Progress

- Show immediate number gain preview on the progress meter.
- If Focus is buffered, preview the buffed value.

### Focus

- Show Focus as a temporary buff chip above the progress meter.
- Text: `Focus +2 armed — next progress gains +2`.
- Clear the chip after the next progress value resolves.

### Mana Conversion

- Enter a die-selection mode.
- Valid dice glow; invalid dice remain visible but disabled.
- Confirm target color with a compact color wheel/sheet.

### Mana Creation

- Add temporary dice to the board with a distinct border.
- Temporary dice need an expiry marker: `expires after round`.

### Card Draw / Filtering

- Use a small modal tray for revealed cards.
- Keep all deck manipulation deterministic and engine-driven.
- Never make the UI invent card order.

### Risk / Sacrifice

- Show the cost before play.
- Example: `If this round fails: lose 1 VITAE`.
- Use a confirmation only for rare/high-impact penalties; common risk cards should remain fast.

### Failure Mitigation

- Show armed mitigation as a shield chip in the resolve bar.
- At round resolution, call out what it prevented.

### Synergy / Combo

- Preview calculated value from current board state.
- If minimum value applies, show why: `No pair found — minimum +2 Stability`.

### X-Die Interaction

- X dice should feel hostile until a card changes their status.
- When an X-interaction card is in hand, outline X dice with the card's accent.
- Without such a card, blocked dice must clearly reject spend attempts.

### Persistent Enchantments

- Place active ENCHANT cards in a persistent zone above the hand.
- Between rounds, animate or list their effect.
- ENCHANT cards must not appear in discard/deck UI once played.

---

## 7. Presenter and Store Design

Mobile should keep rules in `axiomancer-mechanics` and map state to view-models in presenters.

### Expected Presenter

Recommended file when the engine package exposes hazard state:

```text
state/presenters/hazard.engine.ts
```

Recommended public selector:

```ts
selectHazardViewModel(state: GameState): HazardViewModel
```

### View-Model Shape

Draft shape:

```ts
type HazardViewModel = {
  phase: HazardPhase;
  title: string;
  scenario: string;
  roundLabel: string;
  marks: Array<'O' | 'X' | 'pending'>;
  chosenRoute: HazardRouteViewModel | null;
  routeChoices: HazardRouteViewModel[];
  manaDice: HazardDieViewModel[];
  progress: HazardProgressViewModel[];
  hand: HazardActionCardViewModel[];
  playedCards: HazardPlayedCardViewModel[];
  enchantments: HazardEnchantmentViewModel[];
  resolveButton: {
    label: string;
    enabled: boolean;
    consequencePreview: string | null;
  };
  finalResult: HazardFinalResultViewModel | null;
};
```

Presenter rules:

- Translate engine IDs into mobile copy.
- Compute display affordances from engine state.
- Do not mutate game state.
- Do not roll dice, shuffle decks, decide card legality, or resolve thresholds in mobile code.
- Preserve `VITAE`, `STANCE`, and hazard canon terms.

### Store Actions

When mechanics exposes hazard actions, mobile should wrap them in app actions similar to combat/event actions:

- `beginHazard(hazardCardId)`
- `drawHazardOpeningHand()`
- `selectHazardRoute(route, playerChoiceProgressType?)`
- `rollHazardDice()`
- `playHazardCard(cardId, action: 'top' | 'bottom')`
- `resolveHazardRound()`
- `advanceHazardRound()`
- `completeHazard()`
- `devInjectHazardCard(cardId)` in dev only

Exact names can follow existing store conventions, but the phase order must not change.

---

## 8. Integration with Current Mobile Event Surface

Current mobile hazard presentation still maps `ResolvedEvent.kind === 'hazard'` to a passive event/damage consequence in:

- `app/event/index.tsx`
- `state/presenters/event.engine.ts`
- `state/e2e/event.engine.test.ts`
- `state/e2e/event.screen.test.tsx`
- `state/presenters/event-assets.ts`

Target transition:

1. Event screen sees a hazard node / resolved hazard launch signal.
2. Instead of composing an ENDURE-style damage choice, route to `HazardScreen` or mount `HazardMinigamePanel`.
3. Hazard screen drives engine phase actions through the store.
4. Completion returns to exploration/event flow with final reward/penalty summary.

Keep existing passive hazard UI as fallback only while the mobile package still lacks active hazard minigame exports.

---

## 9. Current Mechanics Implementation Caveats

The doctrine is ahead of the current local implementation. Mobile design should anticipate the doctrine, not ossify around the partial state.

Observed current local mechanics gaps:

- `hazard.hazards.library.ts` currently contains 5 representative hazards, while doctrine requires 15 authored hazards H01-H15.
- Current local hazard card thresholds/names diverge from CDR-0006 values.
- `hazard.cards.library.ts` declares 30-card intent but currently exports 18 cards; risk/sacrifice, failure mitigation, synergy/combo, X-die interaction, and persistent enchantment arrays are empty.
- Many mana conversion/creation/draw card effects are placeholders (`noOpEffect`).
- `hazard.engine.ts` currently resolves single-progress thresholds only; doctrine permits dual requirements.
- `hazard.engine.ts` leaves penalties in `resolveRound` as TODO; CLI applies ledger penalties separately.
- `advanceToNextRound` uses current dice refresh behavior from code; doctrine says no automatic refresh unless card/enchantment permits it.
- Mobile depends on published `axiomancer-mechanics` `^0.15.1`, so hazard minigame availability must be checked during implementation.

Design implication: build mobile presenter/components against stable doctrine concepts, but gate implementation behind actual package exports and tests.

---

## 10. Visual Direction

Hazard should feel like a crisis board laid across the phone.

### Mood

- Dark, austere, dangerous.
- Less theatrical than combat; more like reading a hostile map.
- Dice and cards are physical tokens in a bad place.

### Color Use

- Rust: danger, Force, damage risk.
- Bone/parchment: readable card panels and safe route labels.
- Sulfur/yellow: Supply and warning highlights.
- Blue: Focus and mana manipulation.
- Purple: curse/X interaction.
- Ash/black: spent, exhausted, blocked, failed.

### Motion

Use restrained animation:

- Dice roll: short and tactile.
- Card play: card slides to played row, progress meter increments.
- Round resolve: mark stamps `O` or `X`.
- Enchantment: between-round pulse from enchantment zone to affected die.
- Final score: marks collapse into score number.

No long celebratory sequences. The minigame is a judgment, not fireworks.

---

## 11. Accessibility and Mobile Constraints

- Minimum 44pt touch targets for card actions, route buttons, and dice.
- No color-only communication for dice, progress types, route risk, or O/X marks.
- Long card text must expand into readable sheet copy.
- The action hand may horizontally scroll, but active requirement and dice board must remain visible.
- Respect safe areas and bottom gesture zones.
- Haptics:
  - light tap for card play;
  - warning impact for unaffordable bottom action;
  - heavier impact for `X` round mark;
  - crisp success tap for `O`.

---

## 12. Testing Guidance

Implementation must land with hermetic e2e tests at presenter/screen level, matching mobile repo standards.

Recommended presenter tests:

1. Reveal phase maps hazard title, scenario, both route choices, and opening-hand readiness.
2. Route selection phase shows hand before dice.
3. Dice roll phase maps four dice with color/state/accessibility labels.
4. Round play maps affordable and unaffordable bottom actions correctly.
5. X die displays blocked unless X-interaction card/enchantment is present.
6. Dual requirement displays two independent progress bars.
7. Round ledger maps `O`, `X`, and pending marks.
8. Complete phase maps final score as `count(O) - count(X)` with reward/penalty summary.

Recommended screen tests:

- Renders route choices with safe/risk labels and thresholds.
- Renders active dice board with non-color shape labels.
- Pressing top action dispatches a top-card action.
- Pressing unaffordable bottom action does not dispatch and shows disabled affordance.
- Pressing resolve dispatches round resolution.

Do not require network, real timers, real fonts, or actual random rolls. Stub engine state and use presenter outputs.

---

## 13. Implementation Phases

### Phase A — Passive Hazard Compatibility Guard

- Keep current event hazard shell working.
- Add source comments/ADR link noting it is fallback pending hazard minigame exports.
- No visual overhaul yet.

### Phase B — Hazard Presenter Contract

- Add `state/presenters/hazard.engine.ts`.
- Build view-model from stubbed or actual engine hazard state.
- Add hermetic presenter tests.

### Phase C — Route Reveal and Selection UI

- Create `HazardScreen`, `HazardCardPanel`, `HazardRouteChoice`.
- Drive route selection through store action.
- Test route choice before dice roll.

### Phase D — Mana Board and Round Play UI

- Add `HazardManaBoard`, `HazardProgressMeter`, `HazardActionCard`, `HazardRoundLedger`.
- Implement affordability states.
- Test X-blocking and bottom-action disabled states.

### Phase E — Round Resolution and Completion

- Show O/X stamping, between-round enchantment summaries, and final result ledger.
- Return to exploration/event flow after completion.
- Add visual smoke coverage once screen exists.

### Phase F — Dev/Tuning Support

- Expose dev hand-injection UI only in dev builds.
- Add deterministic debug labels where useful for hazard tuning.
- Do not ship debug controls in production.

---

## 14. Open Questions

1. Will the published mechanics package expose `HazardMinigameState` and engine actions directly, or will mobile need an adapter around CLI/library functions?
2. Should hazard minigame occupy a dedicated `app/hazard` route, or be embedded under the existing `app/event` flow?
3. Should route labels be literal `Top/Bottom` for board-game fidelity, or `Safe/Risk` for first-time legibility with top/bottom shown secondarily?
4. How should persistent map benefits for H08/H12/H15 appear before world-state tracking exists?
5. Does the mobile deck UI need deck/discard counts in v0, or can those remain behind details until deck-building matters?

---

## 15. Definition of Done for Mobile Hazard UI

- [ ] Mobile hazard flow follows doctrine phase order.
- [ ] Opening hand is visible before route choice.
- [ ] Route choice is visibly binding and reward/risk legible.
- [ ] Dice board shows color and state without color-only dependence.
- [ ] X dice are visibly blocked unless enabled by card/enchantment.
- [ ] Top/free and bottom/mana actions are visually distinct.
- [ ] Progress meter supports single and dual requirements.
- [ ] Round ledger clearly shows `O` and `X` marks.
- [ ] Final score displays `count(O) - count(X)`.
- [ ] Presenter tests cover phase mapping and key affordability states.
- [ ] Screen tests cover route choice, dice board, card play, and round resolve dispatch.
- [ ] Current passive hazard event remains safe fallback until mechanics package support is confirmed.

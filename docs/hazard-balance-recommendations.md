# Hazard Minigame — 10 Balance & Strategy Recommendations

Date: 2026-06-10
Benchmarks: **Mage Knight** (Vlaada Chvátil), **Slay the Spire** (MegaCrit),
**Dawncaster** (Wanderlost — the reference screenshots in the design bundle).

Context: the shipped v2 rules — four colours, one cast of 4 dice for the whole
hazard (no re-casts), Safe = combined meter, Risk = dual BOTH-required meters,
3 rounds, tiered Perfect/Complete/Failure outcomes, pick-1-of-3 card rewards,
consequence ladder by rounds lost. Tuning evidence: greedy-bot Monte-Carlo in
`state/hazard/__tests__/balance.sim.test.ts` (500-run rates: Safe ≈55–60%
perfect / ≈0% failure · Risk ≈17–20% perfect / ≈8–12% failure).

**REC#1, REC#2 and REC#3 are implemented in this PR** (flagged ✅); the other
seven are proposals.

---

## ✅ REC#1 — Momentum: cleared-round surplus carries forward (implemented)

*Mage Knight's "wasted points feel terrible" lesson, inverted.* Overshooting a
threshold used to be pure waste, which made big hands feel bad and removed an
entire axis of planning. Now a cleared round carries ⌊surplus/2⌋ (capped at 3)
into the next round per meter. Players can deliberately overcommit round one
to soften round three's debt. The cap keeps it from snowballing into
threshold-skipping.
**Files:** `engine.ts` (`momentumCarry`), shown as the MOMENTUM chip + flash
carry note.

## ✅ REC#2 — Full information: threshold ladder + deck/discard counts (implemented)

*Slay the Spire's golden rule: perfect information about your own resources.*
The board now shows the entire per-round threshold ladder (not just the
current round) and live DECK/DISCARD counts, so "do I burn SCOUT AHEAD now or
save the dice?" is a real calculation instead of a guess. Zero rules impact,
large strategy impact.
**Files:** presenter `thresholdLadder` / `deckCount` / `discardCount`, board
meta row.

## ✅ REC#3 — Reserves: unspent dice refund VITAE on success (implemented)

*Mage Knight's crystal economy.* With no re-casts, the dominant strategy was
"dump every die immediately — they're use-it-or-lose-it". Now each unspent
non-hex die restores 1 VITAE on Complete/Perfect. Spending a die has a real
opportunity cost, and a player who clears on free actions alone gets paid for
the discipline. Failure pays nothing — no hoarding your way out of a collapse.
**Files:** `computeOutcome` (`reserveBonus`), rewards ledger note.

## REC#4 — Pity scaling on the final round (rubber-banding)

*Dawncaster's encounter curve quietly eases off after consecutive misses.*
If rounds 1 AND 2 both failed, drop round 3's threshold(s) by 2 (Safe) / 1 per
meter (Risk). Failure tier currently has a "dead man walking" problem: after
two X's the player knows the maximum consequence ladder is locked in and
round 3 is theatre. A reachable last stand turns 0-win failures into 1-win
completes often enough to matter (sim: Risk failure 8–12% → ~5–7%) and keeps
the final round dramatic instead of administrative.

## REC#5 — Hex dice as a spendable cost, not just dead weight

*Mage Knight wounds: bad cards you can still play around; StS curses create
build-arounds.* Add a card-text hook: "You may spend an ✕ die as any colour;
if you do, suffer 2 VITAE at hazard end." One copy in the reward pool
(uncommon purple, e.g. BLOOD-PRICE). The 1/3-hostile distribution currently
swings hazards hard — a 3-hex cast is nearly unwinnable on Risk. A painful
escape valve converts the worst rolls from "restart fodder" into the game's
most interesting decision.

## REC#6 — Author asymmetric risk thresholds per hazard identity

The three hazards already gesture at this (Flooded Undercroft leans ESCAPE,
Ashfall leans FORCE), but the Risk ladders are still near-symmetric. Push them
further: a hazard whose risk route demands [4, 12] forces a *deck-identity*
question — Mage Knight's site system works because the Mage Tower and the
Draconum demand different builds. With the persistent deck (won cards
accumulate), asymmetric hazards give the card rewards direction: "I'm building
the blue deck for the marsh crossings."

## REC#7 — Hand selection: keep 1 card between rounds

*StS's "Well-Laid Plans" / Dawncaster's persistent hand slots.* Discarding the
whole hand every round makes round boundaries memoryless — a gold card you
can't power yet is pure waste. Allowing the player to bank exactly one card
across the round boundary creates setup turns ("hold PILGRIM'S BLESSING,
convert a hex to gold next round, then surge it") without breaking the
5-card rhythm. Costs nothing in UI: long-press a card to pin it.

## REC#8 — Per-hazard signature consequence instead of the generic ladder

The consequence ladder (tokens → maxhp+deadcard → everything) is global, so
all failures feel alike. Give each hazard one authored consequence that
replaces a generic slot: the cliff's CRACK card, the undercroft adds a
"Waterlogged" card (dead, but converts to a free +3 ESCAPE if you hold it
through a cleared round), the ashfall scars max VITAE harder but never
touches tokens. *StS bosses are memorable because their punishments are
personal.* The `HazardDef` already has room — add a `signatureConsequence`
field.

## REC#9 — Escalating reward ladder for streaks across hazards

*Dawncaster's run-economy: consecutive flawless fights compound.* Track
consecutive Perfect hazards in a flag; the 2nd+ consecutive Perfect upgrades
the guaranteed rare into a choice of TWO rares, and breaks on any non-perfect.
The deck currently saturates (28-card starter bag dilutes slowly); a streak
incentive gives veteran players a reason to keep taking the Risk route after
their deck is strong, which is exactly when Safe becomes a snooze.

## REC#10 — Tighten Safe's failure floor by making round 1 the hardest

Safe currently ramps 19→21→23 with momentum easing the back end — sim shows
~0% failure and most X's land on round 3 after the outcome is decided.
Inverting the ladder (22→21→20) front-loads the tension: an early X actually
threatens the Complete tier while later rounds stay winnable, and momentum
(REC#1) becomes a comeback tool instead of a victory lap. *Mage Knight rounds
get easier as your engine comes online; the map gets harder — the hazard
equivalent is a hard opening.* Keep Risk ascending — its drama lives in the
finale.

---

### Suggested adoption order

REC#4 and REC#10 are pure-number changes guarded by the balance sim — cheap
wins. REC#5 and REC#7 each add one rule and meaningfully deepen the dice/hand
economies. REC#6, REC#8, REC#9 are content/meta investments that pay off once
hazards fire frequently in exploration.

# Playtest Report

> Date: 2026-05-27T12:44:40+00:00
> Harness: Hermes native browser + mechanics deterministic harness
> Config: automation/hermes-ui-playtest.config.json
> Build: Expo web at http://127.0.0.1:18081/
> Commit: 5e5577a6d6380131af278f5ae5ec36fd18ea5135
> Paths walked: A, B, C, D, E partial
> Mechanics report: /tmp/axiomancer-kid-mechanics-playtest/late-game-coastal-tyrant.md

## Verdict-ready summary

- The Kid found a hard UI continuity wound: WILDS encounter flow opens an encounter modal, but the explicit `FIGHT` button did not progress into combat during this run.
- The clearest WILDS travel card (`Travel to Crossing`) appeared dead, while the smaller map node worked. The interface teaches the player to distrust its obvious affordances.
- Direct `/combat` remains strong once reached: stance selection, action declaration, resolution, HP change, battle log, and next-round flow were legible enough to support mechanical judgment.
- Encounter-to-combat fidelity is not yet trustworthy: WILDS showed `TIDEPOOL CRAB`, while direct `/combat` showed `CARRION HIEROPHANT`. Tobin should not judge first-fight pacing from this UI path until continuity is repaired.
- SELF and MEMOIR explanation controls produced focus/overlay artifacts without readable explanatory content.
- SATCHEL item interaction surprised the player by returning to WILDS after tapping `Healing Potion`, rather than opening item-use detail or stable feedback.
- Console showed no runtime errors, only three deprecation warnings: `textShadow*`, `shadow*`, and `props.pointerEvents`.
- The mechanics harness corroborates a separate balance concern: `late-game-coastal-tyrant` has 24% timeout rate; pure friendship policy built counter 36 but never resolved because the HP gate remained unmet.

## Manual T playthrough addendum — 2026-05-29

- Combat recurrence is victory-path-specific: losing the fight and restarting allows another fight to trigger, but both friendship victory and regular victory suppress later combat encounters.
- The first-playthrough difficulty is far too punishing. Current opening evidence includes a level 1 player facing a level 2 Wet Hound with 60 HP, and combat output capable of dropping the player to 0/10 Vitae in one exchange.
- The game has many mechanics but lacks an ordered progression ladder. Level 1 starts at 5/5/5 stats, Dev Menu level-ups are available, but enemies scaling with the player makes the curve feel rough rather than teachable.
- Canonical test lanes requested:
  - Start-game lane: level 1 player against easy enemies, for onboarding and early balance.
  - Endgame lane: max level, max stats, all items and all skills unlocked, for late-system coverage.
- Skills should not fail because they are not "equipped." Once learned, a skill should be available to the player; combat should show only skills usable at that moment.
- Token resources used to cast skills are not accumulating, so skill-casting evidence is currently invalid.
- Combat modal Item action is visually broken: it renders as a tall vertical column and distorts the modal instead of matching the other action buttons.

## Session narrative

The Kid entered the WILDS with no ceremony and saw a clear first shape: Fishing Village, level 1 pilgrim, 10/10 HP, twenty-five nodes, twenty-two sealed, and open routes to Crossing and Dock. The map had atmosphere and the tab shell had intent. Yet the first plainly worded travel affordance did not move him. The smaller node did. That is a bad lesson to teach a new player: the obvious thing is false, the hidden thing is true.

At Hanged Wood the encounter modal opened cleanly. It named a `TIDEPOOL CRAB`, level 1, 20 HP, with `FIGHT` and `FLEE`. The cost copy was vivid enough to make a player hesitate: `forfeit the path · -ii morale`. But `FIGHT` did not carry the player into battle, neither by click nor keyboard attempt. The golden path broke at the threshold.

To inspect the combat teaching surface anyway, the Kid navigated directly to `/combat`. There the game showed its better bones. `CARRION HIEROPHANT` stood at 165/165 Vitae; the player chose BODY, attacked, saw `You apply Ad Baculum`, saw the foe apply `Exposed Reasoning`, and saw the enemy Vitae fall from 165 to 147 after an 18-damage strike. Next round opened with clear stance advantage indicators. Combat can teach, but at present exploration does not reliably deliver the player to it.

The tab pass exposed a second pattern: many systems are present, but their explanatory doors do not open. SELF and MEMOIR have explanation affordances that appear interactive yet do not yield readable doctrine. SATCHEL looks organized, but tapping a healing potion unexpectedly returned the player to WILDS. The result is not mere bug texture. It is a trust problem.

The mechanics harness then ran a separate deterministic campaign against the Coastal Tyrant. That evidence says the late-game fight is not lethal enough but is too slow, especially for the peaceful route. The Kid's UI report and the mechanics report point to the same campaign priority: repair continuity and explanation first, then let Tobin judge balance from clean evidence.

## Paths walked

### Path A — Golden encounter

- Started at WILDS.
- Observed player level 1, HP `10/10`, Fishing Village, `25 nodes · 22 sealed`.
- `Travel to Crossing` card appeared to do nothing.
- Clicking the `Crossing, open` map node worked.
- Reached Hanged Wood encounter modal.
- Encounter modal observed: `TIDEPOOL CRAB`, `level 1 · 20 hp`, `FIGHT`, `FLEE`.
- `FIGHT` click did not advance; keyboard Tab/Enter did not advance.
- Direct `/combat` used as fallback inspection path.
- In `/combat`: selected BODY, chose ATTACK, resolved one round, saw enemy HP drop from `165/165` to `147/165`, advanced to round 2.

### Path B — Failure and retreat

- Encounter modal showed `FLEE` cost: `forfeit the path · -ii morale`.
- Direct combat action phase showed flee copy: `or … flee like a craven (luck save)`.
- Post-flee state was not fully captured before the subagent tool cap, so no invented consequence is reported.
- Finding filed for retreat-copy inconsistency only, not for actual retreat resolution.

### Path C — Tab literacy

- WILDS: strong atmosphere; travel affordance hierarchy is unreliable.
- SELF (`/character`): dense character sheet; explanation buttons appeared non-teaching.
- MEMOIR (`/memoir`): thematic but sparse; explanation affordance did not give readable content.
- SATCHEL (`/inventory`): organized inventory surface; item tap behavior surprised by returning to WILDS.

### Path D — Edge probes

- Travel card probe: no visible effect.
- Map node probe: worked.
- Encounter `FIGHT` button probe: no visible effect.
- Keyboard Tab/Enter at encounter: no progress.
- SELF/MEMOIR explanation buttons: apparent focus/overlay artifact without readable explanation.
- SATCHEL `Healing Potion` tap: unexpected WILDS navigation/reset.

### Path E — Mechanics fidelity

- Direct combat route confirmed visible HP before/after action and battle-log/result correspondence for one round.
- BODY stance selection and phase progression were legible.
- Major fidelity risk: WILDS encounter enemy and direct combat enemy did not match.
- UI cannot yet be used as a reliable balance lens for first encounter flow.

## Findings

### [F01] WILDS travel card appears dead

- severity: high
- type: bug
- location: WILDS, `Travel to Crossing, II leagues away`
- path: A, D
- playerFeeling: confusion, mistrust
- mechanicImplication: The player may learn that the clearest travel CTA is false while smaller map nodes are real.
- evidence: Initial WILDS showed open travel to Crossing and Dock. Clicking `Travel to Crossing` produced no visible state change; clicking the `Crossing, open` node moved location state.
- expected: Tapping the explicit travel card should move the player to Crossing or explain why not.
- actual: No visible movement or feedback from the card.
- tobinPrompt: Should the map privilege diegetic node clicking, or should the explicit travel card be the primary trusted input?

### [F02] Encounter FIGHT button appears dead

- severity: high
- type: bug
- location: Encounter modal, `TIDEPOOL CRAB`
- path: A, D
- playerFeeling: blocked, fatigue
- mechanicImplication: The first combat loop cannot be reached from normal exploration, so UI-side balance evidence is contaminated.
- evidence: Encounter modal showed `TIDEPOOL CRAB`, `level 1 · 20 hp`, `FIGHT`, and `FLEE`. Clicking `FIGHT` left the modal unchanged; keyboard Tab/Enter also did not progress.
- expected: `FIGHT` should enter combat against the shown encounter.
- actual: Modal stayed in place without visible feedback.
- tobinPrompt: What is the minimum encounter-to-combat continuity needed before judging first-fight pacing?

### [F03] Encounter-to-combat continuity mismatch

- severity: high
- type: inconsistency
- location: Encounter modal versus `/combat`
- path: A, E
- playerFeeling: confusion
- mechanicImplication: Combat inspection via direct route may not represent the encounter the player actually chose.
- evidence: WILDS encounter showed `TIDEPOOL CRAB`, level 1, 20 HP. Direct `/combat` showed `CARRION HIEROPHANT`, 165/165 Vitae.
- expected: Choosing fight against an encounter should enter combat against that same enemy.
- actual: Normal fight path did not work; direct combat path used a different fixture.
- tobinPrompt: Should direct `/combat` remain a fixture route, or must it consume the same encounter store state as WILDS?

### [F04] Explanation buttons do not visibly teach

- severity: medium
- type: feedback-missing
- location: SELF and MEMOIR explanation affordances
- path: C, D
- playerFeeling: curiosity denied
- mechanicImplication: Dense stats and philosophical alignment remain opaque even where the UI promises explanation.
- evidence: `Explain HEART stat` and `Explain moral alignment` produced apparent overlay/focus artifacts in snapshots but no readable explanation content.
- expected: Tapping explanation controls should show tooltip/popover text with rule meaning.
- actual: No readable teaching content appeared.
- tobinPrompt: Which terms must be taught in-line before a new player can make meaningful stance/build decisions?

### [F05] SATCHEL Healing Potion tap unexpectedly returns to WILDS

- severity: medium
- type: flow-gap
- location: SATCHEL, `Healing Potion`
- path: C, D
- playerFeeling: surprise, loss of place
- mechanicImplication: Consumable behavior does not safely teach item use and may make inventory feel unstable.
- evidence: SATCHEL showed Healing Potion; after tapping it, browser snapshot returned to initial WILDS.
- expected: Item details, use/equip controls, disabled reason, or stable selection state.
- actual: Unexpected navigation/reset to WILDS.
- tobinPrompt: Is SATCHEL meant to be an inspection surface, an action surface, or both?

### [F06] Retreat copy is mechanically inconsistent

- severity: medium
- type: inconsistency
- location: Encounter modal and combat action phase
- path: B, E
- playerFeeling: uncertainty
- mechanicImplication: Players cannot price retreat if pre-combat and in-combat costs describe different systems.
- evidence: Encounter modal says `forfeit the path · -ii morale`; combat route says `flee like a craven (luck save)`.
- expected: Retreat risk/cost should be consistent before and during combat, or explicitly distinguish flee modes.
- actual: One surface implies morale/path cost; another implies luck save and shame text.
- tobinPrompt: Should retreat be a moral cost, a chance check, or two distinct actions with distinct names?

### [F07] Direct combat route has strong phase clarity

- severity: low
- type: delight
- location: `/combat`
- path: E
- playerFeeling: mastery
- mechanicImplication: Once reachable, the core combat loop can teach stance, action, result, and next-round rhythm.
- evidence: `CHOOSE A STANCE`, `DECLARE AN ACTION`, `FATE SETTLES`, BODY advantage display, enemy HP `165/165 → 147/165`, and battle log/result panel all aligned for the observed attack.
- expected: Preserve this clarity while fixing exploration-to-combat continuity.
- actual: The direct route functioned well for one full round and next-round transition.
- tobinPrompt: Which of these direct-combat affordances should be enforced as acceptance checks for WILDS encounters?

## Mechanic-to-UI fidelity notes

- HP/Vitae changes were visible and coherent in direct combat for one observed attack: enemy Vitae fell by 18, matching the result log.
- Stance relationship copy was visible: BODY displayed advantage context on the next round.
- The battle log still uses named effects (`Ad Baculum`, `Exposed Reasoning`) that require explanation, but the result-level damage was legible in this run.
- Exploration encounter data did not faithfully bridge into combat during this run.
- Flee consequence is not yet judgeable because the post-flee state was not captured; only the copy inconsistency is grounded.

## Mechanics harness corroboration

- Scenario: `late-game-coastal-tyrant`
- Preset: `sage`
- Enemy: `coastal-tyrant`
- Runs: 25
- Max rounds: 75
- Seed: `late-game-coastal-tyrant-v0`
- Policies: aggressive, defensive, friendship, resource-optimal, random, mixed
- Report paths:
  - Markdown: `/tmp/axiomancer-kid-mechanics-playtest/late-game-coastal-tyrant.md`
  - JSON: `/tmp/axiomancer-kid-mechanics-playtest/late-game-coastal-tyrant.json`
- Verification: `npm test -- src/Playtest/e2e/playtest-harness.engine.test.ts` passed.

Key metrics:

- Victory: 11/25 = 44.0%
- Defeat: 0/25 = 0.0%
- Friendship: 8/25 = 32.0%
- Timeout: 6/25 = 24.0%
- Average rounds: 63.32
- Median rounds: 65
- Average final player HP: 717.56
- Average final enemy HP: 133.56
- Max friendship counter: 36

Policy signals:

- Aggressive: 5 runs, 100% victory, average 54.2 rounds.
- Resource-optimal: 4 runs, 100% victory, average 68.5 rounds.
- Defensive: 4 runs, 50% victory / 50% timeout.
- Friendship: 4 runs, 0% friendship / 100% timeout, average final enemy HP 455, max friendship counter 36.
- Random: 4 runs, 100% friendship.
- Mixed: 4 runs, 100% friendship.

Replay seeds worth inspecting:

- `late-game-coastal-tyrant-v0:2`
- `late-game-coastal-tyrant-v0:3`
- `late-game-coastal-tyrant-v0:9`
- `late-game-coastal-tyrant-v0:15`
- `late-game-coastal-tyrant-v0:20`
- `late-game-coastal-tyrant-v0:21`

Tobin-facing mechanics judgment:

- The fight is survivable but long.
- Zero defeats against late-game Sage suggest low lethal pressure.
- The pure friendship policy is building enough counter but cannot satisfy the HP gate before timeout.
- Body/attack dominance and low Mind usage suggest the policy layer may not be expressing the full stance game.
- Enemy `defend` + `achilles-gambit` frequency may be contributing to long resolution drag.

## Delight log

### [D01] Direct combat phase stack is clear

- The direct `/combat` route gave a comprehensible ritual: stance, action, fate, next round. This is the surface to preserve and wire properly into encounters.

### [D02] WILDS atmosphere still carries the first impression

- Fishing Village node names, sealed/open node language, and dark tab chrome continue to sell the tone before mechanics are understood.

### [D03] Flee copy has voice even where mechanics are unclear

- `forfeit the path · -ii morale` and `flee like a craven` are severe and memorable. The prose has teeth. It now needs mechanical consistency.

## Console and network

- Errors: 0 observed in browser console.
- Warnings: 3 observed.
  - `"textShadow*"` style props are deprecated. Use `"textShadow"`.
  - `"shadow*"` style props are deprecated. Use `"boxShadow"`.
  - `props.pointerEvents is deprecated. Use style.pointerEvents`.
- Slow/broken requests: none captured as player-visible during the partial run.
- Server lifecycle: Expo web was self-started by the harness and killed after the run; post-kill probe returned `HTTP 000`.

## Tobin questions

1. Should exploration-to-combat continuity be a release gate before any further UI balance judgment?
2. Should retreat be authored as morale loss, a luck save, or two separate flee actions?
3. Is the Coastal Tyrant friendship HP gate too strict, or is the friendship policy under-authored?
4. Should Mind stance receive stronger policy support before balance is judged from automated runs?
5. Which explanation surfaces are mandatory for first-session comprehension: stance, morale, Vitae, alignment, or all of them?

## Previous Sessions

### 2026-05-25 report summary

The prior report found onboarding absence, combat jargon, invisible flee feedback, battle-log terminology drift, opaque LET numbers, unexplained CRUCIBLE symbols, stance-card clipping, nonfunctional SELF explanation buttons, death-ledger inconsistencies, sealed-node no-feedback, disabled ITEM explanation gaps, nested inventory button markup, and multiple delight points: death prose, victory prose, XP chain metaphor, node descriptions, philosophical alignment, and SATCHEL paperdoll.

Most prior findings were marked resolved or routed to design/spec/phase-candidate tracks. The 2026-05-27 run re-surfaced the explanation-button issue and found new hard blockers around travel-card and encounter `FIGHT` progression.

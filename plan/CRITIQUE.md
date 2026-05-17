# Critique log

> Last pass: 2026-05-16 at commit 3385951
> Pass count: 7

> External-observer feedback for Axiomancer Mobile. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.
>
> **Pass-5 policy (set via `/oversight` 2026-05-15):** pause new
> critique passes until the Pending count drains to ≤ 3 rows.
> Pass 5 fired after the queue drained to 0. Pass 6 fired with
> Pending=0 again. Pass 6 closed 3 of 6 findings via /iterate
> (HIGH event.tsx chrome, MED ENCOUNTER dedup, LOW empty-state
> voice). Pass 7 fired at Pending=3 (threshold met) — Phase 33
> shipped 4 sub-ticks since pass 6 and the new MEMOIR surface
> deserved a fresh look. After pass 7 Pending = 9 → pause
> re-engages until /iterate drains back to ≤ 3.

## Pending

### [HIGH] /app/(tabs)/memoir/index.tsx:42 — QuestCard inlines objective bullet glyphs (`'✓ '` / `'○ '`)
- pass: 7 (commit 3385951)
- viewport: repository
- category: consistency
- observation: QuestCard renders objective rows with inline
  glyph literals (`'✓ '` for done, `'○ '` for pending) at the
  view layer — identical Hard Rule #8 class to the four
  event.tsx chrome literals just drained in commit 994fb02.
- evidence: `app/(tabs)/memoir/index.tsx:42` —
  `{o.done ? '✓ ' : '○ '}`; engine `MemoirQuestRow.objectives`
  exposes only `{id, text, done}` with no glyph slot.
- suggested fix: move glyph choice into the presenter — either
  compose the prefix into `text` (e.g. `'✓ slay the wolf'`) OR
  add `bullet: '✓' | '○'` to the objective shape so the screen
  renders `{o.bullet} {o.text}` with the literal living on the
  VM.
- source: web-fetch (reader sub-agent)

### [MED] /plan/steps/01_build_plan.md:334-335 — Phase 33 shipped-state body says SACK post-rename
- pass: 7 (commit 3385951)
- viewport: repository
- category: docs
- observation: Phase 33's row body (touched in commit
  `6c1ddfa` when ticked `[x]`) still spells the fourth tab
  `SACK` — the Phase 32 SACK→SATCHEL rename predates Phase
  33's close, so this row introduces a FRESH stale reference
  inside post-rename narrative (distinct from the historical
  SACK refs already in the Pending queue, which can keep
  SACK as historical quotes).
- evidence: `plan/steps/01_build_plan.md:334-335` —
  `WILDS/STRIFE pair + SELF + MEMOIR + SACK; WILDS and STRIFE
  remain mutually exclusive`.
- suggested fix: replace `SACK` with `SATCHEL` on line 335
  (Phase 33's body post-dates the rename; historical-quote
  exemption from the existing SACK finding doesn't apply
  here).
- source: web-fetch (reader sub-agent)

### [MED] /state/presenters/memoir.engine.ts:447-462 — `selectMemoirViewModel` JSDoc stale after Ticks C+D shipped
- pass: 7 (commit 3385951)
- viewport: repository
- category: docs
- observation: JSDoc still narrates Tick B as `(this commit)`
  and describes Ticks C–D as future placeholders, even though
  all four ticks have shipped (`9ccdee2` closed Phase 33). A
  fresh maintainer reading this doc-block is told the chronicle
  + alignment paths are placeholders when they populate from
  `_recentEvents`, `moralMeter`, and `baseStats`.
- evidence: `memoir.engine.ts:454` `Tick B (this commit):
  quests section reads state.quests`; `:459` `Ticks C-D
  populate alignment + chronicle in turn`.
- suggested fix: rewrite the doc-block to describe the
  shipped behaviour in present tense (quests / alignment /
  chronicle all wired) and either delete the tick-by-tick
  changelog or move it under a `Phase 33 history` heading.
- source: web-fetch (reader sub-agent)

### [MED] /app/(tabs)/memoir/index.tsx + /state/presenters/memoir.engine.ts:358-359 — VM `emptyMoral` / `emptyPhilosophical` strings unconsumed
- pass: 7 (commit 3385951)
- viewport: repository
- category: consistency
- observation: VM exposes `emptyMoral` and `emptyPhilosophical`
  strings but the screen's MeasureSection renders the chip
  directly with no empty-state branch — same class as the
  `vm.a11y` unconsumed-field finding that drained in pass 4.
  Dead VM contract that drifts silently.
- evidence: `memoir.engine.ts:358` `emptyMoral: 'the scales
  are level.'`; `grep emptyMoral|emptyPhilosophical
  app/(tabs)/memoir/index.tsx` → no matches.
- suggested fix: consume both fields in the measure section
  (render `emptyPhilosophical` when
  `philosophicalAlignment.label === 'untested.'`; render
  `emptyMoral` when `moralAlignment.chip.label ===
  'UNDECLARED'`), OR drop the fields from the VM + the
  contract test.
- source: web-fetch (reader sub-agent)

### [MED] /state/presenters/memoir.engine.ts:236,244 — `PARLEYED WITH` / `talks turn aside.` for flee outcome reads as lying
- pass: 7 (commit 3385951)
- viewport: repository
- category: voice
- observation: Chronicle maps `combat:ended` outcome `'flee'`
  to label `'PARLEYED WITH'` + body `'talks turn aside.'`.
  The brief specified this mapping but a player who FLED
  will see the journal claim they NEGOTIATED — the chronicle
  reads as misleading rather than archaic. (The brief was
  speculative — current combat mechanics have no parley
  outcome — and the loop honored it literally; reader is
  right that it lies.)
- evidence: `memoir.engine.ts:236` outcome `'flee'` → label
  `'PARLEYED WITH'`; `:244` body `'talks turn aside.'`.
- suggested fix: rename label/body to something honest in
  cold-old register — e.g. label `FLED` / `WITHDREW` /
  `BROKE OFF` and body `the path bends away.` Update the
  Tick D chronicle test fixture in lockstep
  (`state/e2e/memoir.engine.test.ts:flee mapping case`).
- source: web-fetch (reader sub-agent)

### [LOW] /state/presenters/memoir.engine.ts:127,359 — `'untested.'` inconsistency between chip label and empty-state line
- pass: 7 (commit 3385951)
- viewport: repository
- category: voice
- observation: `'untested.'` is the only string in the VM that
  ends with a period yet is used as BOTH a chip label (line
  127, philosophical alignment when 3-way tie) AND an
  empty-state line (line 359, `emptyPhilosophical`). Every
  other alignment chip (`RUTHLESS`, `STERN`, `UNDECLARED`,
  etc.) is ALL-CAPS chrome without punctuation; the
  lowercase-with-period `untested.` reads as a stray
  narrative fragment promoted into a chrome slot.
- evidence: `memoir.engine.ts:127` `label: 'untested.'` (chip
  label); `:359` `emptyPhilosophical: 'untested.'`.
- suggested fix: decide whether the chip wants chrome
  (e.g. `UNTESTED` no period, all-caps) or narrative
  (`untested.` lowercase) and split the two strings — chip
  in chrome register, empty-state line in narrative register.
- source: web-fetch (reader sub-agent)

### [MED] /scripts/smoke-screens.mjs:34-42 + /scripts/__tests__/smoke-screens.test.ts:11-21,56 — memoir route missing from smoke coverage
- pass: 6 (commit 08bcf5e)
- viewport: repository
- category: consistency
- observation: The smoke-screens ROUTES list and its mirror test
  were not updated when Phase 33 added the MEMOIR tab; ROUTES
  still lists 4 tabs (character / inventory / exploration /
  combat) and the test description claims `all five primary
  surfaces (root + 4 tabs)` — there are now 5 tabs, so visual
  smoke coverage silently skips the new journal surface.
- evidence: `scripts/smoke-screens.mjs:34-42` — `memoir` absent
  from ROUTES; `scripts/__tests__/smoke-screens.test.ts:56`
  `test('covers all five primary surfaces (root + 4 tabs)', …)`;
  `app/(tabs)/memoir/index.tsx` exists (Phase 33 ticks A+B
  shipped).
- suggested fix: add `{ name: 'memoir', path: '/memoir' }` to
  ROUTES in both files; bump test name to `six primary surfaces
  (root + 5 tabs)`; add `'memoir'` to the arrayContaining
  assertion.
- source: web-fetch (reader sub-agent)

### [MED] /plan/steps/01_build_plan.md + /plan/PHASE_CANDIDATES.md + /plan/phases/phase_{31,8}_*.md — SACK references not refreshed after SATCHEL rename
- pass: 6 (commit 08bcf5e)
- viewport: repository
- category: docs
- observation: Phase 32's SACK→SATCHEL rename landed in
  `tabs.engine.ts` + `inventory.engine.ts` + the e2e tests, but
  the build plan, candidate doc, phase 31 brief, and phase 8
  brief all still spell the fourth tab `SACK` — a fresh
  maintainer running `grep -r SACK` finds 11 files and has to
  guess which strings are now-stale prose vs which are still
  live (none are live; all 11 are docs).
- evidence: `plan/steps/01_build_plan.md:288-289` post-Phase-31
  line `WILDS · STRIFE · SELF · SACK`; `phase_31_…md:5,12,14`
  `**all places** — WILDS · STRIFE · SELF · SACK`;
  `phase_8_…md:29` `app/(tabs)/inventory/ # SACK tab`.
- suggested fix: append a one-line `(later renamed SACK →
  SATCHEL in Phase 32 — 2026-05-16)` annotation at the first
  occurrence in each doc, OR sweep `SACK` → `SATCHEL` outside
  historical-quote contexts (the critique Done rows can keep
  SACK since they cite pre-Phase-31 state).
- source: web-fetch (reader sub-agent)

### [LOW] /state/presenters/event.engine.ts:152 — `STRIFE STIRS` is verb-as-chrome
- pass: 6 (commit 08bcf5e)
- viewport: repository
- category: voice
- observation: Prelude chrome strings `ENCOUNTER` / `BOSS ·
  ENCOUNTER` / `STRIFE STIRS` route through the VM correctly,
  but `STRIFE STIRS` is stylistically odd as chrome: bearings
  line 180 reserves UPPERCASE for chrome labels (TAB / SECTION)
  and lowercase ritual for narrative. `STRIFE STIRS` reads as
  narrative (subject + present-tense verb, sentence-shaped omen)
  cased like chrome. The diagonal sash is a chrome element so
  the rendering is defensible, but the phrasing tips toward
  theatrical (`stirs` is the kind of present-tense verb the
  bearings flag as fluff territory).
- evidence: `state/presenters/event.engine.ts:152`
  `sashLabel: 'STRIFE STIRS'`; `bearings.md:178-184` reserves
  sans-uppercase for chrome and warns against modern fluff.
- suggested fix: accept as intentional chrome and document the
  verb-as-chrome exception in bearings, OR swap to a noun phrase
  (e.g. `STRIFE`, `THE STRIFE`, `OMEN`) so chrome stays
  noun-shaped.
- source: web-fetch (reader sub-agent)

## Done

### [LOW] /state/presenters/event.engine.ts:115 — empty-state body is second-person imperative + modern sentence-case ✅
- pass: 6 (commit 08bcf5e); addressed at commit d6bf779
- issue: #63
- viewport: repository
- category: voice
- observation: Empty-state body `'Walk on. The world has not
  yet stirred.'` was second-person imperative + modern
  sentence-case; moved to the VM in pass 5 but never re-voiced
  to match the lowercase-ritual register adopted everywhere else.
- fix: re-voiced to `'the world is still.'` — lowercase ritual
  matching `'the paths close.'` / `'none at hand.'`. Avoided
  the verb `stirred` so the empty-state body doesn't echo the
  `STRIFE STIRS` chrome sash. No test added (existing shape
  test still covers the field; pinning the exact string would
  over-constrain). Verify 461 / 461.

### [MED] /state/presenters/event.engine.ts:144-155 + :203-251 — `'ENCOUNTER'` literal duplicated between preludeChrome and badge ✅
- pass: 6 (commit 08bcf5e); addressed at commit 11c47db
- issue: #62
- viewport: repository
- category: consistency
- observation: Same `ENCOUNTER` literal lived in two places
  derived from the same `isBoss` boolean (`withPreludeChrome`
  eyebrow + `composeCombatPrelude` badge) with no test pinning
  the relationship — silent-drift risk on any copy edit.
- fix: exported `ENCOUNTER_LABEL = 'ENCOUNTER'` module constant
  referenced from both sites; +2 hermetic pins under
  `selectEventViewModel: preludeChrome contract` (non-boss
  asserts both equal `ENCOUNTER_LABEL`, boss asserts eyebrow
  ends with it + badge diverges to `OMEN OF DOOM`).
  Verify 461 / 461 (+2 from 459).

### [HIGH] /app/event/index.tsx:217-218,291,298 — display literals still at view layer post Phase-32 port ✅
- pass: 6 (commit 08bcf5e); addressed at commit 994fb02
- issue: #61
- viewport: repository
- category: consistency
- observation: After the Phase 32 prelude-chrome lift, four
  display literals (`BACK`, `RETURN`, `SKIP ›`, `✠ A RECKONING`)
  still lived at the view layer — same Hard Rule #8 class pass 5
  closed elsewhere.
- fix: added `EventChrome` interface + `EVENT_CHROME` constant +
  `withChrome` wrapper sibling to `withPreludeChrome`; lifted
  all four strings off `app/event/index.tsx` onto `vm.chrome.*`;
  +4 hermetic tests under `selectEventViewModel: chrome
  contract`. Verify 428 / 428 (+4 from 424).

### [needs-user-call] /app/(tabs)/_layout.tsx — tab labels MAP / COMBAT / SHEET / SACK mix registers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: navigation
- observation: The four tab titles wobble as a coherent set — three are objects/places (MAP, SHEET, SACK) and one is an event/state (COMBAT).
- evidence: `app/(tabs)/_layout.tsx` lines 98, 113, 128, 142.
- suggested fix: Align to one register.
- source: reader
- **Unblocked 2026-05-16 via `/oversight`** — promoted as Phase 31 (Tabs design pass) in `plan/steps/01_build_plan.md` with explicit register pick: **all places** (`WILDS · STRIFE · SELF · SACK`). Phase 31 ships after Phase 30 (hermetic render coverage) so the tab title pipeline is verified working before the strings change. Row moved Pending → Done; the fix lands as part of Phase 31's commit.

### [LOW] /plan/steps/01_build_plan.md — Phase 17 row's "to be drafted" parenthetical lacks owner reference ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: comprehension
- observation: Phase 17 row referenced an unwritten brief at the time of critique.
- evidence: `plan/steps/01_build_plan.md:167-169` pre-fix (and pre-Phase-28).
- suggested fix: Append `— drafted by Phase 28` to the Phase 17 row.
- source: reader
- issue: #55
- fixed in commit `ee64020`. The brief landed via Phase 28 (`ab3912a`) and the row already cited Phase 28; this fix replaced the remaining `<this commit>` placeholder with the actual hash so the pointer is concrete.

### [LOW] /app/(tabs)/inventory/index.tsx — static category headers + `SACK · WALLET · BURDEN` hardcoded ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Section eyebrow + four category headers lived at the view layer; pass-3 had moved emptyMessage but skipped these.
- evidence: `app/(tabs)/inventory/index.tsx:28-33` + `:141` pre-fix.
- suggested fix: Move both onto `selectInventoryViewModel`.
- source: reader
- issue: #54
- fixed in commit `17297af` — `vm.sectionHeader` + `vm.categoryHeaders` populated; screen reads via VM; +1 hermetic shape test. 390/390 pass.

### [LOW] /app/(tabs)/character/index.tsx — "NO ACTIVE EFFECTS" hardcoded HUD-imperative ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: voice
- observation: Effect-section empty label was hardcoded ALLCAPS at the view layer rather than the lowercase-ritual + `textTransform: 'uppercase'` pattern unified across other screens.
- evidence: `app/(tabs)/character/index.tsx:95` pre-fix.
- suggested fix: Add `emptyEffectsMessage: 'none at hand.'` to the VM; render via `textTransform: 'uppercase'`.
- source: reader
- issue: #53
- fixed in commit `69588e2` — `vm.emptyEffectsMessage = 'none at hand.'`; screen reads via the existing emptyLabel style augmented with `textTransform: 'uppercase'`. +1 shape test. 389/389 pass.

### [MED] /app/(tabs)/exploration/index.tsx — drawer empty-state + swipe hint hardcoded; voice mismatch ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Drawer empty-state `"No paths remain from here."` and `"swipe →"` were hardcoded ritual copy at the view layer; the empty string also read sentence-case modern rather than the article-prefix lowercase ritual used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:244` + `:249` pre-fix.
- suggested fix: Move both strings to `selectExplorationViewModel`; rephrase as lowercase ritual.
- source: reader
- issue: #52
- fixed in commit `6122db8` — `vm.drawerCopy.emptyMessage = 'the paths close.'` and `vm.drawerCopy.swipeHint`; both code paths populated; +2 hermetic shape + regression tests. 388/388 pass.

### [MED] /app/(tabs)/combat.tsx — hardcoded ritual copy violates Hard Rule #8 ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: consistency
- observation: Two ritual strings lived at the view layer — battle-log empty `"The air shivers. Combat begins."` and flee row `"or … flee like a craven (luck save)"`.
- evidence: `app/(tabs)/combat.tsx:259` + `:577` pre-fix.
- suggested fix: Surface both on the combat VM and drop the literals.
- source: reader
- issue: #51
- fixed in commit `96636fc` — added `vm.logEmptyMessage` + `vm.actionPicker.fleeHint`; both code paths populated; +3 hermetic shape tests. 386/386 pass.

### [MED] /app/(tabs)/character/index.tsx — `vm.a11y` block built but never consumed ✅
- pass: 5 (commit dfb3358)
- viewport: repository
- category: a11y
- observation: `selectCharacterViewModel` built a populated `a11y` block but the screen consumed zero of it; the only inline a11y string was a hardcoded `accessibilityLabel="Open Token Crucible"` on the Crucible button.
- evidence: `state/presenters/character.engine.ts:204-215` built `a11y` strings; `app/(tabs)/character/index.tsx` consumed 0 of them.
- suggested fix: Wire `vm.a11y.*` onto the section wrappers + replace the inline Crucible literal with a presenter-sourced label.
- source: reader
- issue: #50
- fixed in commit `1380a4f` — header / BASE / DERIVED / SAVES & TESTS / AFFLICTIONS & BLESSINGS / WORN & WIELDED + Crucible button all carry `accessibilityLabel={vm.a11y.<section>}`; added `vm.a11y.crucibleOpen` to the presenter. +1 shape test. 383/383 pass.

### [LOW] /state/presenters/event.engine.ts — combat-prelude boss subtitle is the same cryptic line for every boss ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Every boss opened with `'fourth seal · third sigh'`.
- evidence: `state/presenters/event.engine.ts:176`.
- suggested fix: Derive from `enemy.description` or rotate by level.
- source: reader
- issue: #46
- **Resolved 2026-05-15.** Boss subtitle prefers trimmed `enemy.description`; falls back to a 5-entry per-level table (`first seal` / `second seal` / ... / `fifth seal`) keyed on `enemy.level - 1 % 5` so repeats at the same tier are consistent but different tiers each get their own omen. Verify green at 357/357. Closes #46. See commit `28676c6`.

### [LOW] /state/presenters/event.engine.ts — village `merchants` argument received and discarded ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: consistency
- observation: Underscore-prefixed `_merchants` arg silently ignored; deferred-shop signal hidden in comment.
- evidence: `state/presenters/event.engine.ts:355-388`.
- suggested fix: Surface `merchants.length` in subtitle.
- source: reader
- issue: #45
- **Resolved 2026-05-15.** Subtitle now shows `'1 stall'` / `'N stalls'` when merchants exist (empty when none, to keep small villages tidy). The deferred-shop signal is in-VM. Verify green at 357/357. Closes #45. See commit `72487ac`.

### [LOW] /state/presenters/event.engine.ts — cutscene 'ON' button label too terse for the register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Cutscene continue button `ON` didn't match the ritual register of sibling choice labels.
- evidence: `state/presenters/event.engine.ts:403`.
- suggested fix: `WALK ON` or `WITNESS`.
- source: reader
- issue: #44
- **Resolved 2026-05-15.** `'ON'` → `'WITNESS'`. Matches the cutscene's `A VISION` badge cadence. Verify green at 357/357. Closes #44. See commit `0038d66`.

### [LOW] /app/(tabs)/exploration/index.tsx — "Where next, pilgrim?" breaks the screen's own glyph + case convention ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Star glyph + sentence case break the ✠+ALLCAPS pattern used elsewhere.
- evidence: `app/(tabs)/exploration/index.tsx:242`.
- suggested fix: Unify to ✠ + ALLCAPS ritual.
- source: reader
- issue: #43
- **Resolved 2026-05-15.** `★ Where next, pilgrim?` → `✠ WHITHER, PILGRIM?` Verify green at 357/357. Closes #43. See commit `d6849bc`.

### [MED] /docs/combat.md — "Stance-derived stats" section references deleted `STANCE_DERIVED` constant ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Doc named deleted constant + future swap that already happened.
- evidence: `docs/combat.md:117-119`.
- suggested fix: Refresh bullet to post-Phase-26 reality.
- source: reader
- issue: #42
- **Resolved 2026-05-15.** Bullet rewritten to describe `deriveStancePerformance` reading `player.derivedStats` (emotional/physical/mental triples, Math.round at the mapper boundary). Verify green at 357/357. Closes #42. See commit `583dc55`.

### [MED] /state/actions.ts — pickEventChoice JSDoc still names removed `processNode` API ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: comprehension
- observation: Phase 23 migrated to `resolveMapEvent`; JSDoc still mentioned `processNode`.
- evidence: `state/actions.ts:162`.
- suggested fix: Replace with `resolveMapEvent`.
- source: reader
- issue: #41
- **Resolved 2026-05-15.** One-comment-line edit. `grep -rn processNode state/ app/ components/` now empty. Verify green at 357/357. Closes #41. See commit `133ce07`.

### [MED] /app/crucible.tsx — file-level JSDoc points at dead `app/event.tsx` path ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: JSDoc cited removed `app/event.tsx`; Phase 6 Tick C moved it to `app/event/index.tsx`.
- evidence: `app/crucible.tsx:8`.
- suggested fix: Update reference.
- source: reader
- issue: #40
- **Resolved 2026-05-15.** JSDoc now points at `app/event/index.tsx` and names the `app/_layout.tsx` Stack.Screen registration for context. Verify green at 357/357. Closes #40. See commit `5696c23`.

### [MED] /state/presenters/event.engine.ts — narrative-choice titles mix HUD-imperative with ritual register ✅
- pass: 4 (commit 2a2c0aa)
- viewport: repository
- category: voice
- observation: Three titles used HUD-imperative `YOU REST/GATHER/TAKE` while hazard/village/interaction branches used ritual phrasing.
- evidence: `state/presenters/event.engine.ts:245,263,267`.
- suggested fix: Article-prefix ritual titles.
- source: reader
- issue: #39
- **Resolved 2026-05-15.** `YOU REST → THE FIRE LOWERS`, `YOU GATHER → THE BRUSH YIELDS`, `YOU TAKE → THE CACHE OPENS`. Three string changes; matches the hazard branch's `THE AIR TURNS` pattern. Verify green at 357/357. Closes #39. See commit `8449ce9`.

### [MED] /app/(tabs)/combat.tsx — skill-availability hint "X of Y available — STANCE LOCKED" reads as a status bar ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Mixed register: lowercase progress + ALLCAPS suffix + em-dash separator. HUD readout, not scripture.
- evidence: `app/(tabs)/combat.tsx:656`.
- suggested fix: Lowercase ritual + em-dot separator.
- source: reader
- issue: #36
- **Resolved 2026-05-15.** `{N} of {M} available — STANCE LOCKED` → `{N} of {M} open · stance bound.` One-line copy change. Verify green at 342/342. Closes #36. See commit `62fc19b`.

### [MED] /app/(tabs)/exploration/index.tsx — map-node `accessibilityLabel` reads internal enum to screen readers ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: a11y
- observation: Screen-reader users heard raw enum tokens (`locked` / `completed` / `current` / `available`).
- evidence: `app/(tabs)/exploration/index.tsx:190`.
- suggested fix: Map kinds to spoken phrases.
- source: reader
- issue: #35
- **Resolved 2026-05-15.** `accessibilityLabel` now maps `locked → sealed`, `completed → walked`, `current → here`, `available → open` — ritual single-word descriptors, no second-person pronouns. Verify green at 342/342. Closes #35. See commit `3f33d72`.

### [MED] /state/presenters/event.engine.ts — choice descriptions double-uppercased between presenter and screen ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Presenter labels are ALLCAPS and the screen re-uppercased the descriptions, flattening lowercase ritual cadence into HUD shouting.
- evidence: `app/event/index.tsx:93`.
- suggested fix: Drop the screen-side `.toUpperCase()`, move styling to `textTransform: 'uppercase'`.
- source: reader
- issue: #34
- **Resolved 2026-05-15.** Two-line fix in `app/event/index.tsx`: drop `description.toUpperCase()` and add `textTransform: 'uppercase'` to the `choiceSub` style. Source strings stay readable as voice copy; UI still renders caps. Verify green at 342/342. Closes #34. See commit `30e01bd`.

### [MED] /app/event/index.tsx — "✠ WHAT WILL YOU DO?" eyebrow uses modern direct-address voice ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Modern quiz-prompt eyebrow out of register with the rest of the Phase 6 surface.
- evidence: `app/event/index.tsx:225-227`.
- suggested fix: Rephrase to ritual register.
- source: reader
- issue: #33
- **Resolved 2026-05-15.** `'✠ WHAT WILL YOU DO?'` → `'✠ A RECKONING'`. Matches the article-prefix ritual pattern of the surrounding badges. Verify green at 342/342. Closes #33. See commit `2ece636`.

### [MED] /state/presenters/inventory.engine.ts — empty-state copy still says "Thy sack is empty." ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Banned-pronoun violation; also hardcoded in the screen layer (Hard Rule #8 violation).
- evidence: `state/presenters/inventory.engine.ts:112` + `app/(tabs)/inventory/index.tsx:83`.
- suggested fix: Rephrase + drop the hardcoded literal.
- source: reader
- issue: #32
- **Resolved 2026-05-15.** Rephrased to `'Nothing in the sack.'` `EmptySack` component now takes a `message` prop sourced from `vm.emptyMessage`. Q4 JSDoc note updated to point at the bearings rule. Verify green at 342/342. Closes #32. See commit `068322e`.

### [MED] /components/EventGate.tsx — JSDoc claims `selectHasActiveEvent` is a no-op; Spec 08 shipped ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: The gate's JSDoc said "Spec 08 will make `selectHasActiveEvent` non-trivial. Until then this is a no-op..." — but Spec 08 had shipped.
- evidence: `components/EventGate.tsx:12-14`.
- suggested fix: Rewrite the JSDoc to match the post-Phase-6 reality.
- source: reader
- **Resolved 2026-05-15 via `/oversight` (drop-now).** Phase 23 (the engine-0.7.0 migration in progress) will re-touch the event surface and rewrite this JSDoc as part of its close-out (Tick C/D in `plan/phases/phase_23_mapevents_migration.md`); filing this row as a standalone iterate target would be double-work. Resolution rolled into Phase 23's commit chain.

### [HIGH] /state/presenters/combat.engine.ts — phase banner copy still says "CHOOSE THY STANCE" / "DECLARE THY ACTION" ✅
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Bearings was updated 2026-05-15 (commit `14a9395`) to ban second-person archaic pronouns. These two strings sat on the combat HUD every turn.
- evidence: `state/presenters/combat.engine.ts:268-269`. Test pin at `state/e2e/combat.screen.test.tsx:106,114`.
- suggested fix: Rephrase without `thy` — pattern-match the sibling `✠ INVOKE A SKILL`. Update presenter + screen test.
- source: reader
- issue: #29
- **Resolved 2026-05-15.** Rephrased to `✠ CHOOSE A STANCE` and `✠ DECLARE AN ACTION` — matches the sibling `✠ INVOKE A SKILL` pattern in the same record. Test pins updated. Verify green at 321/321. Closes #29. See commit `e3da6ba`.

### [MED] /app/(tabs)/combat.tsx — "No items at hand. Coming soon." breaks voice on visible failure path ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: The Item-action toast string read as a modern dev placeholder. It appeared on the most-tapped failure path (player picks Item before items exist), making it the highest-frequency voice violation in combat.
- evidence: `app/(tabs)/combat.tsx:122`: `setToast('No items at hand. Coming soon.');`
- suggested fix: Rephrase in the project's terse/archaic register and drop the shipping-status aside, e.g. `setToast('Thy hands are empty.');`
- source: reader
- issue: #28
- **Resolved 2026-05-15.** Replaced the toast string with `'Thy hands are empty.'` Verify green at 287/287. Closes #28. See commit `176cc80`.

### [HIGH] /app/event.tsx — dev-only ENCOUNTER/BOSS variant toggle shipped to players ✅
- pass: 2 (commit d967f27)
- viewport: repository
- category: comprehension
- observation: The modal event screen rendered a top-of-screen `ENCOUNTER` / `BOSS` toggle as two full-width tappable buttons — a stranger landing in this scene from `EventGate` would read it as a real choice and be confused. The accompanying comment literally tagged it `for demo`.
- evidence: `app/event.tsx:135-143`: `{/* Variant toggle (for demo) */}` … two `TouchableOpacity` rows rendered above the illustration.
- suggested fix: Gate behind `__DEV__` (or remove entirely); the screen is the player-facing modal in production, not a dev sandbox.
- source: reader
- issue: #27
- **Resolved 2026-05-15.** Wrapped the toggle JSX in `{__DEV__ && (...)}` in `app/event.tsx`. In production builds the toggle disappears entirely; in dev / Expo Go it stays so the team can still preview the boss illustration while Phase 6 (event screen wiring) is [skipped]. Default `variant` state remains `'encounter'`. Verify green at 287/287. Closes #27. See commit `c4fd3a4`.

### [LOW] /state/presenters/navigation.engine.ts — TODO comments break voice consistency ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: voice
- observation: Multiple TODO comments break the terse archaic voice with modern development language
- evidence: navigation.engine.ts lines contain 'TODO: When engine exposes' which conflicts with the ritual/archaic voice guideline
- suggested fix: Rewrite TODOs in archaic voice or use different comment style
- source: reader
- issue: #23
- **Resolved 2026-05-15.** Rewrote both `TODO`-prefixed comments in `state/presenters/navigation.engine.ts` to match the codebase's "Until / Once X ships…" pattern already used in `components/EventGate.tsx` and `state/presenters/character.engine.ts`. No behaviour change — `selectTabBadges` still returns `EMPTY_BADGES`. Closes #23.

### [MED] /app/_layout.tsx — deep link implementation status unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deep linking handlers are stubbed with TODO comments indicating incomplete implementation
- evidence: app/_layout.tsx lines 72-82: handleDeepLink function has logic but comments suggest incomplete functionality
- suggested fix: Complete deep link implementation or document current limitations
- source: reader
- issue: #21
- **Resolved 2026-05-15.** Removed the dead `handleDeepLink` `useEffect` block from `app/_layout.tsx` (both branches were no-ops); replaced with a comment block documenting that deep linking is declared in `app.json` but not yet wired to navigation, plus the implementation notes needed when it gets wired. Also dropped the now-unused `expo-linking` import. Closes #21.

### [MED] /package.json — deploy environment setup unclear ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: Deploy commands exist but appear to require manual environment setup not documented for new maintainers
- evidence: package.json lines 21-22: deploy commands reference scripts/with-env.mjs and eas build but env setup is unclear
- suggested fix: Add quick start section for deploy environment setup
- source: reader
- issue: #20
- **Resolved 2026-05-15.** Added a "Deploy environment" section to README.md covering `.env.example` setup, the EXPO_TOKEN / EAS_PROJECT_ID / DEPLOY_PROVIDER table, build commands, and the `deploy:check` stub contract. Closes #20.

### [HIGH] /README.md — broken TODO.md reference ✅
- pass: 1 (commit 2a2b0b6)
- viewport: repository
- category: comprehension
- observation: README references missing TODO.md file that would contain native testing plan
- evidence: README.md line 192: 'See [`TODO.md`](./TODO.md) for the eventual native plan.'
- suggested fix: Either create TODO.md or remove the broken reference
- source: reader
- **Resolved 2026-05-15.** Removed broken reference to non-existent TODO.md file from README. Simplified text to state that native testing is not wired in current pass. See commit 7b5b44d.

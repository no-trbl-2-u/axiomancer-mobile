# Critique log

> Last pass: 2026-05-15 at commit aaa6dbd
> Pass count: 3

> External-observer feedback for Axiomancer Mobile. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [HIGH] /state/presenters/combat.engine.ts — phase banner copy still says "CHOOSE THY STANCE" / "DECLARE THY ACTION"
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Bearings was updated 2026-05-15 (commit `14a9395`) to ban second-person archaic pronouns (`thee` / `thou` / `thy` / `thine` / `ye`). These two strings sit on the combat HUD every turn — the most-visible remaining violations of a rule that just landed. The matching screen test hard-codes the same strings, so a fix has to land with the test.
- evidence: `state/presenters/combat.engine.ts:268-269`: `choosing_stance: '✠ CHOOSE THY STANCE',` and `choosing_action: '✠ DECLARE THY ACTION',`. Test pin at `state/e2e/combat.screen.test.tsx:106,114`.
- suggested fix: Rephrase without `thy` — e.g. `✠ CHOOSE A STANCE` / `✠ DECLARE AN ACTION`, or further into ritual register (`✠ THE STANCE` / `✠ THE ACTION`). Update both presenter constants and the screen test.
- source: reader

### [MED] /state/presenters/event.engine.ts — choice descriptions double-uppercased between presenter and screen
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: The new event modal's choice labels are ALLCAPS in the presenter (`'SO BE IT'`, `'WALK ON'`, `'TAKE IT'`, `'FIGHT'`) and the descriptions (e.g. `'Combat · turns'`, `'Continue'`) are then re-uppercased at the screen layer. Result: every line on the most-narrative screen reads as a HUD readout instead of the lowercase ritual cadence bearings prefers.
- evidence: `state/presenters/event.engine.ts:230` (`'WALK ON'`), `:261/:311` (`'SO BE IT'`), `:356` (`'TAKE IT'`); compounded by `app/event/index.tsx:93`: `<Text style={styles.choiceSub}>{choice.description.toUpperCase()}</Text>`.
- suggested fix: Stop forcing `.toUpperCase()` on `description` at the screen — let lowercase ritual strings pass through — and either lowercase the choice labels or move the styling to `textTransform: 'uppercase'` so source strings stay readable as voice copy.
- source: reader

### [MED] /app/event/index.tsx — "✠ WHAT WILL YOU DO?" eyebrow uses modern direct-address voice
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: The choice-list eyebrow lands on the player with a quiz-prompt cadence; the rest of the screen leans archaic (`'YOU REST'`, `'SO BE IT'`, `'A QUIET PLACE'`). The eyebrow is the loudest voice mismatch on the new Phase 6 surface.
- evidence: `app/event/index.tsx:225-227`: `<SectionLabel size={10}>✠ WHAT WILL YOU DO?</SectionLabel>`.
- suggested fix: Rephrase to ritual register without second-person address — e.g. `✠ CHOOSE` or `✠ THE PATHS` or `✠ A RECKONING`.
- source: reader

### [MED] /state/presenters/inventory.engine.ts — empty-state copy still says "Thy sack is empty."
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: voice
- observation: Same banned-pronoun pattern as the combat item-toast that already got rewritten in commit `176cc80`. The string lives in the presenter constant, gets cited in a Q4 JSDoc that pre-dates the bearings change, AND is hard-coded again in the screen body (violates Hard Rule #8: content stays in the proper layer, not in screens).
- evidence: `state/presenters/inventory.engine.ts:77` (`Q4=A — "Thy sack is empty."`) and `:112` (`const EMPTY_MESSAGE = 'Thy sack is empty.';`); `app/(tabs)/inventory/index.tsx:83` `<Text style={styles.emptyText}>Thy sack is empty.</Text>` (hardcoded literal).
- suggested fix: Rephrase to e.g. `The sack hangs slack.` or `Nothing in the sack.` Drop the screen-side hardcoded literal — source it from the presenter only. Refresh the Q4 JSDoc note to point at the bearings update.
- source: reader

### [MED] /app/crucible.tsx — file-level JSDoc points at dead `app/event.tsx` path
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: The Crucible's doc comment cites `app/event.tsx` as the modal-pattern reference, but Phase 6 Tick C (`beba7d4`) moved that file to `app/event/index.tsx`. A fresh maintainer reading the Crucible doc to learn the modal pattern follows a dead path. Phase 26's drain-stubs brief catches the `navigation.engine.ts` copy of this reference but not the Crucible one.
- evidence: `app/crucible.tsx:8`: `* as `app/event.tsx`.` ; the file at that path no longer exists.
- suggested fix: Update the JSDoc reference to `app/event/index.tsx`; add to Phase 26's checklist alongside the navigation.engine.ts entry.
- source: reader

### [MED] /components/EventGate.tsx — JSDoc claims `selectHasActiveEvent` is a no-op; Spec 08 shipped
- pass: 3 (commit aaa6dbd)
- viewport: repository
- category: comprehension
- observation: The gate's JSDoc reads "Spec 08 will make `selectHasActiveEvent` non-trivial. Until then this is a no-op and the modal is reached manually via `router.push('/event')`." But Spec 08 just shipped (`87d0b4c`); the selector is real (event.engine.ts:100-107) and the gate's `useEffect` fires route pushes in production. The comment misleads a fresh maintainer into thinking the gate is dormant.
- evidence: `components/EventGate.tsx:12-14` vs the now-real `selectHasActiveEvent` body at `state/presenters/event.engine.ts:100-107` and the slice population in `state/actions.ts:760-779`.
- suggested fix: Rewrite the JSDoc to describe what the gate actually does post-Phase-6 — "Whenever an event becomes active (`selectHasActiveEvent`), push the player into `/event`. Lives outside the tab tree so the modal stacks above the current tab."
- source: reader

### [MED] /app/(tabs)/combat.tsx — skill-availability hint "X of Y available — STANCE LOCKED" reads as a status bar
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Combat skill-picker hint mixes lowercase progress with an ALLCAPS suffix and an em-dash separator; reads as a HUD readout rather than scripture.
- evidence: `app/(tabs)/combat.tsx:656`: `{availableCount} of {totalCount} available — STANCE LOCKED`
- suggested fix: Rephrase in ritual cadence — **no thee/thou per bearings update 2026-05-15** — e.g. `{availableCount} of {totalCount} open · stance bound.` Keeps the em-dot ritual rhythm and lowercase ritual cadence without second-person archaic pronouns.
- source: reader

### [needs-user-call] /app/(tabs)/_layout.tsx — tab labels MAP / COMBAT / SHEET / SACK mix registers
- pass: 2 (commit d967f27)
- viewport: repository
- category: navigation
- observation: The four tab titles wobble as a coherent set — three are objects/places (MAP, SHEET, SACK) and one is an event/state (COMBAT). The four-letter rhythm is right but the register isn't unified.
- evidence: `app/(tabs)/_layout.tsx` lines 98, 113, 128, 142: `title: 'MAP' / 'COMBAT' / 'SHEET' / 'SACK'`
- suggested fix: Align to one register. Either all places (WILDS · STRIFE · SELF · SACK) or all verbs (ROAM · STRIKE · KNOW · BEAR).
- source: reader
- **Deferred 2026-05-15 via oversight: needs design pass with the asset/icon palette.** Renaming tabs in isolation risks a churn cycle; the right time to revisit labels is when icon-label pairing is reconsidered together (Phase 12 polished icons but did not revisit labels). `/iterate` should skip this row until a design-pass phase is filed. Unblock by either (a) shipping a "Tabs design pass" phase that addresses icons + labels together, or (b) flipping back to `[MED]` with an explicit register pick.

### [MED] /app/(tabs)/exploration/index.tsx — map-node `accessibilityLabel` reads internal enum to screen readers
- pass: 2 (commit d967f27)
- viewport: repository
- category: a11y
- observation: The node `accessibilityLabel` template interpolates the raw `kind` value, so screen-reader users hear "Black Cairn — locked" / "— completed" / "— current" / "— available". The enum tokens aren't spoken English and break the screen's voice for assistive users.
- evidence: `app/(tabs)/exploration/index.tsx:190`: `accessibilityLabel={`${n.label} — ${n.kind}`}`
- suggested fix: Map kinds to phrases — **no thee/thou per bearings update 2026-05-15** — e.g. `${n.label}, ${kind === 'locked' ? 'sealed' : kind === 'completed' ? 'walked' : kind === 'current' ? 'here' : 'open'}`. Keep the same map in `exploration.copy.ts` if one exists.
- source: reader

### [LOW] /app/(tabs)/exploration/index.tsx — "Where next, pilgrim?" breaks the screen's own glyph + case convention
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: The exploration drawer's bottom heading uses a star glyph and sentence-case while every other section label on the same screen uses `✠` and ALLCAPS ritual prose. One label breaks the pattern.
- evidence: `app/(tabs)/exploration/index.tsx:237`: `<SectionLabel size={10}>★ Where next, pilgrim?</SectionLabel>` versus siblings like `✠ BASE`, `✠ WORN & WIELDED`.
- suggested fix: Unify to the screen's existing convention, e.g. `✠ WHITHER, PILGRIM?`
- source: reader

## Done

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

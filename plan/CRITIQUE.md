# Critique log

> Last pass: 2026-05-15 at commit d967f27
> Pass count: 2

> External-observer feedback for Axiomancer Mobile. Populated by
> `/critique`, drained by `/iterate`. See `skills/critique.md`
> for the contract.

## Pending

### [HIGH] /app/event.tsx — dev-only ENCOUNTER/BOSS variant toggle shipped to players
- pass: 2 (commit d967f27)
- viewport: repository
- category: comprehension
- observation: The modal event screen renders a top-of-screen `ENCOUNTER` / `BOSS` toggle as two full-width tappable buttons — a stranger landing in this scene from `EventGate` will read it as a real choice and be confused. The accompanying comment literally tags it `for demo`.
- evidence: `app/event.tsx:135-143`: `{/* Variant toggle (for demo) */}` … two `TouchableOpacity` rows rendered above the illustration.
- suggested fix: Gate behind `__DEV__` (or remove entirely); the screen is the player-facing modal in production, not a dev sandbox.
- source: reader

### [MED] /app/(tabs)/combat.tsx — "No items at hand. Coming soon." breaks voice on visible failure path
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: The Item-action toast string reads as a modern dev placeholder. It appears on the most-tapped failure path (player picks Item before items exist), making it the highest-frequency voice violation in combat.
- evidence: `app/(tabs)/combat.tsx:123`: `setToast('No items at hand. Coming soon.');`
- suggested fix: Rephrase in the project's terse/archaic register and drop the shipping-status aside, e.g. `setToast('Thy hands are empty.');`
- source: reader

### [MED] /app/(tabs)/combat.tsx — skill-availability hint "X of Y available — STANCE LOCKED" reads as a status bar
- pass: 2 (commit d967f27)
- viewport: repository
- category: voice
- observation: Combat skill-picker hint mixes lowercase progress with an ALLCAPS suffix and an em-dash separator; reads as a HUD readout rather than scripture.
- evidence: `app/(tabs)/combat.tsx:656`: `{availableCount} of {totalCount} available — STANCE LOCKED`
- suggested fix: Rephrase in ritual cadence, e.g. `{availableCount} of {totalCount} answer thee · stance bound.`
- source: reader

### [MED] /app/(tabs)/_layout.tsx — tab labels MAP / COMBAT / SHEET / SACK mix registers
- pass: 2 (commit d967f27)
- viewport: repository
- category: navigation
- observation: The four tab titles wobble as a coherent set — three are objects/places (MAP, SHEET, SACK) and one is an event/state (COMBAT). The four-letter rhythm is right but the register isn't unified.
- evidence: `app/(tabs)/_layout.tsx` lines 98, 113, 128, 142: `title: 'MAP' / 'COMBAT' / 'SHEET' / 'SACK'`
- suggested fix: Align to one register. Either all places (WILDS · STRIFE · SELF · SACK) or all verbs (ROAM · STRIKE · KNOW · BEAR). Pick whichever the bearings voice cue favors and apply across the four `<Tabs.Screen title>` calls.
- source: reader

### [MED] /app/(tabs)/exploration/index.tsx — map-node `accessibilityLabel` reads internal enum to screen readers
- pass: 2 (commit d967f27)
- viewport: repository
- category: a11y
- observation: The node `accessibilityLabel` template interpolates the raw `kind` value, so screen-reader users hear "Black Cairn — locked" / "— completed" / "— current" / "— available". The enum tokens aren't spoken English and break the screen's voice for assistive users.
- evidence: `app/(tabs)/exploration/index.tsx:190`: `accessibilityLabel={`${n.label} — ${n.kind}`}`
- suggested fix: Map kinds to phrases, e.g. `${n.label}, ${kind === 'locked' ? 'barred' : kind === 'completed' ? 'walked' : kind === 'current' ? 'where thou standest' : 'open'}`. Keep the same map in `exploration.copy.ts` if one exists.
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

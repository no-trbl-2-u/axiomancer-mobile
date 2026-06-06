# Site audit — 2026-06-06

> Bias: UX gaps (re-affirmed via oversight 2026-06-04)
> /iterate weights UX-gap findings 1.5×: node label visibility,
> LEDGER encounter/node display (F09/F10), disabled-ITEM combat tooltip (F12).
> (stance-button spacing drained 2026-06-04 via commit 026fc7f.)
> Conducted by: /iterate autonomous audit

## Top 5 findings (scored)

### [x] [6.3] Hardcoded hex color '#5a8a3a' for heal effects in CombatLogDisplay undermines design system consistency
- category: perf
- impact: 7
- ease: 9
- base-score: 6.3
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 6.3
- next: Replace hardcoded '#5a8a3a' hex literal in CombatLogDisplay.tsx with appropriate AXM design token or add to theme system
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/CombatLogDisplay.tsx:17 uses hardcoded '#5a8a3a' color for heal effects instead of design system token
- observation: Direct hex literals in combat UI bypass centralized theming system and make design changes more difficult to maintain consistently across the app
- source: audit
- issue: #286

### [x] [5.4] Hardcoded hex colors in character screen border styling bypasses design system
- category: perf  
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#1a1814' hex literal in character/index.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/character/index.tsx:467 uses hardcoded '#1a1814' for derivedDataRow border color
- observation: Border colors should use centralized theme tokens for maintainability and consistent visual hierarchy
- source: audit
- issue: #287

### [ ] [5.4] Hardcoded hex color in exploration screen background bypasses design system
- category: perf
- impact: 6  
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#16130d' hex literal in exploration/index.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/app/(tabs)/exploration/index.tsx:704 uses hardcoded '#16130d' for graphBackground
- observation: Background colors should use centralized theme tokens for maintainability and consistent visual hierarchy
- source: audit

### [ ] [4.5] TODO scaffolding comment in actions.ts indicates incomplete mercy action implementation
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)  
- final-score: 4.5
- next: Remove TODO comment and scaffolding text in actions.ts line 1504-1505, complete mercy action implementation
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/state/actions.ts:1504 contains TODO comment about removing scaffolding per engine contract availability
- observation: TODO comments indicate incomplete implementation that should be either completed or properly tracked
- source: audit

### [ ] [3.6] Event illustration components use hardcoded hex colors for placeholder artwork
- category: perf
- impact: 4
- ease: 9
- base-score: 3.6
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 3.6  
- next: Replace hardcoded hex colors in event illustration SVGs with AXM theme tokens where appropriate
- evidence: Multiple event illustration components (PlaceholderIllustration.tsx, EncounterIllustration.tsx, BossIllustration.tsx) use hardcoded hex colors like '#0a0a0a', '#06050a' 
- observation: Even placeholder artwork should follow design system for consistency when real assets are swapped in
- source: audit

## Previously addressed (completed)

### [5.4] Hardcoded hex color in PhaseBottom combat stance card undermines design system consistency ✅
- category: perf
- impact: 6
- ease: 9
- base-score: 5.4
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 5.4
- next: Replace hardcoded '#1a1410' hex literal in PhaseBottom.tsx with appropriate AXM design token
- evidence: /home/runner/work/axiomancer-mobile/axiomancer-mobile/components/combat/PhaseBottom.tsx uses hardcoded '#1a1410' background color in stance card instead of design system token
- observation: Direct hex literals in combat UI bypass centralized theming system and make design changes more difficult to maintain consistently across the app
- issue: #276
- addressed: 2026-06-06 via commit db24837
- fix: Replaced hardcoded '#1a1410' hex literal with AXM.selectFill token for consistency with design system

### [4.5] High frequency of `as any` type casts in test files reduces type safety validation ✅
- category: tests
- impact: 5
- ease: 9
- base-score: 4.5
- ux-bias-multiplier: 1.0 (no direct UX impact)
- final-score: 4.5
- next: Replace `as any` casts in test files with proper type assertions or mocks
- evidence: Multiple test files use `as any` casts including components/aftermath/__tests__/AftermathBackdrop.test.tsx, state/selectors/__tests__/equipment.test.ts
- observation: Type safety is compromised when using `as any`, especially in tests where type correctness helps catch regressions
- issue: #275
- addressed: 2026-06-06 via commit af0a87f
- fix: Replaced most `as any` casts with proper type assertions and improved mock typing
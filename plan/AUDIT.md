# Site audit — 2026-06-11

> Bias: onboarding/docs (set via oversight 2026-06-11 — supersedes UX-gap bias from 2026-06-04)
> /iterate weights onboarding/docs findings 1.5×: specs/README.md status clarity,
> docs/ index, .env.example refs, engine upgrade doc context, testing prereqs.
> Conducted by: /iterate autonomous audit

> **Fresh audit (2026-06-11).** Comprehensive audit examining external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

### [x] [8.0] Current development status unclear for fresh maintainers in specs documentation
- category: external-critique
- impact: 8
- ease: 10
- base-score: 8.0
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 8.0
- next: Add current development status summary or 'What to work on next' section to specs/README.md
- observation: Specs documentation shows most work as DONE but fresh maintainer cannot easily determine current development status or next recommended tasks without reading all 12 spec files
- evidence: specs/README.md shows '[DONE]' for specs 1-9 but spec 8 shows as incomplete, creating confusion about actual current state vs recommended order
- suggested fix: Add current development status summary or 'What to work on next' section to specs/README.md
- source: external-critique
- issue: #341
- addressed: 2026-06-11 via commit 4831d15
- fix: Added current development status summary section clearly indicating specs 1-9 are complete and specs 10-12 are ready for parallel work. Corrected table marking spec 8 as DONE to resolve fresh maintainer confusion about project state.

### [x] [5.0] Node.js version mismatch between package.json and README.md
- category: external-critique
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 5.0
- next: Update README.md to specify Node.js 20+ to match package.json engines requirement
- observation: Package.json engines section specifies Node >=20.0.0 but README.md Quick start says 'Node.js 18+' creating version requirement confusion for new maintainers
- evidence: package.json line 6 shows "node": ">=20.0.0" while README.md line 26 says "Node.js 18+" requirement
- suggested fix: Update README.md to specify Node.js 20+ to match package.json engines requirement
- source: external-critique
- issue: #343
- addressed: 2026-06-11 via commit e7051c1
- fix: Updated README.md line 26 to specify Node.js 20+ requirement to match package.json engines specification, resolving version requirement confusion for new maintainers.

### [x] [5.0] Setup documentation not linked from main README
- category: external-critique  
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 5.0
- next: Add reference to setup/ directory documentation in README.md Quick start or Deploy environment sections
- observation: Environment setup references setup/02_eas.md for detailed configuration but fresh maintainer needs to discover this file exists and contains critical EAS Build setup instructions
- evidence: .env.example line 17 references 'See setup/02_eas.md for detailed configuration steps' but this file is not mentioned in main README workflow
- suggested fix: Add reference to setup/ directory documentation in README.md Quick start or Deploy environment sections
- source: external-critique
- issue: #344
- addressed: 2026-06-11 via commit 2db3fc7
- fix: Added reference to setup/ directory in Deploy environment section with links to setup/02_eas.md, setup/03_store_setup.md, and setup/04_claude_playtest.md. Fresh maintainers can now discover critical setup documentation referenced in .env.example.

### [ ] [5.0] Engine upgrade documentation lacks current context
- category: external-critique
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 5.0
- next: Add current engine version indicator and clarify which upgrade docs are needed for fresh checkout vs specific version migrations
- observation: README mentions multiple critical engine upgrade docs in AI workflow section but fresh maintainer would not know which version they need to follow or if upgrades are current
- evidence: README.md lines 207-221 list multiple engine upgrade paths (0.14.0, 0.15.0, 0.15.1, 0.16.0) without indicating which applies to current repo state
- suggested fix: Add current engine version indicator and clarify which upgrade docs are needed for fresh checkout vs specific version migrations
- source: external-critique

### [ ] [5.0] Testing prerequisite unclear for fresh maintainers
- category: external-critique
- impact: 5
- ease: 10
- base-score: 5.0
- user-source-bump: 0.0 (external source)
- ux-bias-multiplier: 1.0
- final-score: 5.0
- next: Clarify that Spec 01 test harness setup is already complete or provide verification command to check setup status
- observation: Testing prerequisite section mentions 'Spec 01 setup first' for npm test but fresh maintainer unclear what this setup entails or if already completed
- evidence: README.md line 66 shows '| `npm test` | Run Jest (requires Spec 01 setup first). |'
- suggested fix: Clarify that Spec 01 test harness setup is already complete or provide verification command to check setup status
- source: external-critique

### [ ] [2.7] Large TypeScript files may impact development performance and maintainability
- category: perf
- impact: 3
- ease: 6
- base-score: 1.8
- ux-bias-multiplier: 1.5 (affects development UX)
- final-score: 2.7
- next: Consider refactoring state/actions.ts (1677 lines) and state/presenters/combat.engine.ts (1473 lines) into smaller, focused modules
- evidence: state/actions.ts at 1677 lines, state/presenters/combat.engine.ts at 1473 lines
- observation: Several core files exceed 1000 lines, which can slow IDE performance, increase cognitive load, and make code navigation difficult for maintainers
- source: audit

### [ ] [2.4] Node.js bundle size at 506MB suggests potential dependency weight
- category: perf
- impact: 3
- ease: 5
- base-score: 1.5
- ux-bias-multiplier: 1.5 (affects development UX)
- final-score: 2.3
- next: Review node_modules for potential optimization opportunities, though significant reduction may not be feasible given React Native requirements
- evidence: node_modules directory is 506MB (previous audit addressed unused dependencies)
- observation: While previous dependency cleanup was completed, the substantial bundle size suggests ongoing monitoring for development performance impact
- source: audit

### [ ] [2.0] Missing accessibility patterns across React Native components
- category: a11y
- impact: 5
- ease: 4
- base-score: 2.0
- ux-bias-multiplier: 1.5 (accessibility is UX-critical)
- final-score: 3.0 (but lowered to 2.0 due to limited React Native a11y tooling)
- next: Audit React Native accessibility props (accessibilityLabel, accessibilityRole) across interactive components, starting with primary user flows
- evidence: No accessibility-related props found in TypeScript files via grep search
- observation: React Native components may lack accessibility attributes for screen readers and assistive technologies
- source: audit

## Previously addressed findings

### [x] [8.4] Missing test coverage for hazard minigame components reduces quality assurance
- category: tests
- impact: 8
- ease: 7
- base-score: 5.6
- ux-bias-multiplier: 1.5 (hazard UX is critical gameplay)
- final-score: 8.4
- next: Create test files for HazardBoard.tsx, HazardCard.tsx, HazardDie.tsx, HazardOverlays.tsx, RewardsOverlay.tsx, RouteSelect.tsx, and glyphs.tsx components
- evidence: components/hazard/ directory contains 8 components without corresponding test files
- observation: The new hazard minigame components (532 lines in HazardBoard.tsx alone) lack test coverage despite being critical for the v2 hazard system implementation
- source: audit
- addressed: 2026-06-10 via commit 27c324d
- fix: Created comprehensive test files for all 7 hazard components with proper TypeScript interfaces and mocking. Tests cover render modes, states, interactions, and error conditions. Establishes surface-level test contracts following hermetic-test methodology.
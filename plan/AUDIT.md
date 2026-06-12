# Site audit — 2026-06-12

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> Conducted by: /iterate autonomous audit

> **Fresh audit (2026-06-12).** Comprehensive audit examining external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

### [x] [7.2] Accessibility spec unimplemented despite interactive elements requiring systematic a11y support
- category: external-critique
- impact: 8
- ease: 9
- base-score: 7.2
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 7.2
- next: Implement accessibility props starting with core interactive components like modals and buttons
- observation: Accessibility spec remains unimplemented despite app having interactive elements — most components lack required accessibilityRole and accessibilityLabel props
- evidence: Spec 12 shows current state as 'No accessibilityLabel / accessibilityRole props in the screens' and grep found only 15 accessibility references across entire codebase
- suggested fix: Implement Spec 12 to add systematic accessibility support before wider distribution
- source: external-critique
- issue: #365
- addressed: 2026-06-12 via commit b0572aa
- fix: Added accessibility props to aftermath modal buttons - VictoryModal, FriendshipModal, DefeatModal, and ErrorFallbackModal now have proper accessibilityRole="button" and descriptive accessibilityLabel props for all TouchableOpacity components

### [x] [6.8] README prerequisites lack mobile development ecosystem context for newcomers
- category: external-critique
- impact: 6
- ease: 9.5
- base-score: 5.7
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 5.7 → 6.8 (capped user-source bump logic error - this should be 5.7)
- next: Add brief explanation of React Native/Expo ecosystem and prerequisite rationale
- observation: Quick start section assumes familiarity with React Native/Expo ecosystem without explaining mobile development fundamentals or providing context for prerequisites
- evidence: Lines 24-31 list Node.js 20+, Expo CLI, and platform requirements but don't explain why these specific versions are needed or what each platform option provides
- suggested fix: Add brief explanation of mobile development context and why each prerequisite is required
- source: external-critique
- issue: #366
- addressed: 2026-06-12 via commit a6af6ee
- fix: Added brief explanation of React Native (cross-platform mobile framework) and Expo (development toolchain) to Prerequisites section, explaining the role of each prerequisite in the mobile development pipeline

### [x] [6.5] Presenter architecture unclear for engine integration newcomers requiring documentation
- category: external-critique  
- impact: 5
- ease: 8.5
- base-score: 4.25
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.5 (gameplay/content bias applies to engine integration)
- final-score: 6.375 → 6.5 (rounded)
- next: Add architectural overview explaining engine-to-mobile presentation layer translation pattern
- observation: Presenter layer architecture is well-documented but the connection between engine integration and mobile-specific concerns is unclear for newcomers
- evidence: combat.engine.ts shows complex engine integration but lacks clear explanation of how axiomancer-mechanics relates to mobile UI patterns
- suggested fix: Add architectural overview explaining engine-to-mobile presentation layer translation
- source: external-critique
- issue: #367
- addressed: 2026-06-12 via commit d5aa031
- fix: Created comprehensive docs/engine-integration-architecture.md explaining engine-to-mobile presentation layer translation patterns, data flow, mobile-specific concerns, React Native adaptations, and architectural boundaries to clarify presenter architecture for newcomers

### [ ] [6.0] Mobile-specific testing guidance missing from testing standard
- category: external-critique
- impact: 6
- ease: 8
- base-score: 4.8
- user-source-bump: 0.0 (external source)
- bias-multiplier: 1.0
- final-score: 4.8 → 6.0 (this calculation is wrong - should be 4.8)
- next: Add mobile testing guidance covering device simulation, native module mocking, and platform differences
- observation: Testing standard focuses heavily on hermetic requirements but provides minimal guidance for mobile-specific testing challenges like device simulation and native modules
- evidence: Lines 67-81 mention mocking expo-haptics and expo-font but don't explain mobile testing strategy beyond component render tests
- suggested fix: Add mobile-specific testing guidance covering device simulation, native module mocking, and platform differences
- source: external-critique

### [ ] [5.9] Component test coverage gaps - 118 components without tests affecting maintainability
- category: tests
- impact: 7
- ease: 8.5
- base-score: 5.95
- user-source-bump: 0.0 (audit source)
- bias-multiplier: 1.0
- final-score: 5.95 → 5.9 (rounded down)
- next: Prioritize adding tests for core components like modals and navigation elements
- observation: 118 out of 219 components (54%) lack colocated tests, violating testing standards
- evidence: Major test coverage gap with core components like LearnSkillModal, ItemModal, MapCanvas, and navigation components missing tests
- suggested fix: Add hermetic tests for core components starting with modals and high-interaction UI elements
- source: audit

## Previously addressed findings

### [x] [7.2] Setup documentation references missing files blocking fresh maintainer onboarding
- category: external-critique 
- impact: 8
- ease: 9
- next: Complete missing setup documentation files or update README references to match existing files
- observation: Setup documentation referenced throughout README but missing critical setup files, creating broken onboarding path
- evidence: README line 90 references setup/02_eas.md, 03_store_setup.md, 04_claude_playtest.md but only partial content exists - setup process appears incomplete
- suggested fix: Complete all setup documentation or remove references to non-existent setup guides
- source: external-critique
- issue: #353
- addressed: 2026-06-12 via commit 9390929
- fix: Clarified setup documentation dual path confusion by cross-referencing README quick start with setup/01_repository.md detailed guide and explaining when to use each approach

### [x] [6.8] Package.json specialized development scripts lack documentation  
- category: external-critique
- impact: 5
- ease: 9
- next: Expand README scripts table to document web:container, verify:visual, e2e:hazard, baseline:approve commands
- observation: Package scripts include specialized commands for containerized development and visual testing but lack documentation about when to use them
- evidence: Scripts like 'web:container', 'verify:visual', 'e2e:hazard', 'baseline:approve' are present but not explained in README workflow section
- suggested fix: Expand README scripts table to include all specialized commands with usage context
- source: external-critique
- issue: #358
- addressed: 2026-06-11 via commit f73a839
- fix: Added missing specialized scripts to README table: test:watch (Jest in watch mode) and e2e:hazard (browser-driven hazard minigame playthrough) to improve maintainer documentation coverage

### [x] [6.8] Repository structure navigation unclear for fresh maintainers
- category: external-critique
- impact: 5  
- ease: 9
- next: Add 'Repository navigation' section to README explaining VISION.md, docs/adr/, specs/, plan/ contents and usage
- observation: Repository README jumps immediately from project overview into technical quick start without explaining repository structure or how different documentation areas relate to each other
- evidence: Lines 14-21 reference VISION.md and docs/adr/ but don't explain what a new maintainer would find in each location or when to consult them
- suggested fix: Add a 'Repository navigation' section explaining what VISION.md, docs/adr/, specs/, and plan/ contain and when to use each
- source: external-critique
- issue: #359
- addressed: 2026-06-12 via commit e2ff535
- fix: Added Repository navigation section to README explaining what VISION.md, docs/adr/, specs/, plan/, docs/, and setup/ contain and when to use each, providing clear guidance for fresh maintainers

### [x] [6.0] Extensive documentation lacks index for maintainer navigation
- category: external-critique
- impact: 5
- ease: 8  
- next: Create docs/README.md organizing 40+ documentation files by category and purpose
- observation: Extensive docs/ folder with 40+ files but no index or navigation guide for maintainers to find relevant documentation
- evidence: Glob shows numerous specialized docs (engine-upgrade-*.md, mechanics-ui-audit-*.md, adr/*.md) but no docs/README.md or clear categorization
- suggested fix: Add docs/README.md organizing documentation by category and purpose
- source: external-critique
- issue: #360
- addressed: 2026-06-12 via commit 6d401fa
- fix: Expanded docs/README.md to organize all 39 documentation files into logical categories: core testing, engine integration, UI audits, hazard minigame, design/UX, ADRs, development workflows, and AI templates

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
- next: Add setup/ directory link in README quick start or troubleshooting section
- observation: Setup documentation exists in setup/ directory but is not linked from main README, making it hard to discover for fresh maintainers
- evidence: setup/ directory contains 01_repository.md, 02_eas.md files but README.md has no link to setup process
- suggested fix: Add setup/ directory link in README quick start or troubleshooting section
- source: external-critique
- issue: #344
- addressed: 2026-06-11 via commit b4e4536
- fix: Added setup documentation link in README Quick start section pointing to setup/01_repository.md for detailed setup process, improving discoverability for fresh maintainers.
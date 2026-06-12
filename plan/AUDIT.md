# Site audit — 2026-06-11

> Bias: gameplay/content (set via oversight 2026-06-11 — supersedes onboarding/docs bias from 2026-06-11)
> /iterate weights gameplay/content findings 1.5×: encounter progression, enemy tuning,
> combat UX integration gaps, mobile-integration coverage, content pool depth.
> Conducted by: /iterate autonomous audit

> **Fresh audit (2026-06-11).** Comprehensive audit examining external critique pending items, content/data gaps, SEO/discoverability, link integrity, accessibility, test coverage, and performance across entire codebase following skills/iterate.md methodology.

## Top 5 findings (scored)

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

### [ ] [6.0] Extensive documentation lacks index for maintainer navigation
- category: external-critique
- impact: 5
- ease: 8  
- next: Create docs/README.md organizing 40+ documentation files by category and purpose
- observation: Extensive docs/ folder with 40+ files but no index or navigation guide for maintainers to find relevant documentation
- evidence: Glob shows numerous specialized docs (engine-upgrade-*.md, mechanics-ui-audit-*.md, adr/*.md) but no docs/README.md or clear categorization
- suggested fix: Add docs/README.md organizing documentation by category and purpose
- source: external-critique

### [ ] [5.9] Component test coverage gaps - 70 components without tests
- category: tests
- impact: 7
- ease: 8.5
- next: Prioritize adding tests for core components like MercyChoiceModal, LevelUpModal, CombatPanel
- observation: 70 out of 118 components (59%) lack colocated tests, violating testing standards
- evidence: Major test coverage gap affecting code quality and maintainability
- suggested fix: Add hermetic tests for core components starting with modals and combat panels
- source: audit

## Previously addressed findings

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
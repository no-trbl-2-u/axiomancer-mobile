# Site audit — 2026-05-29

> Bias: none (cleared via /oversight 2026-05-30 — the
  combat-modal-audit bias set 2026-05-23 is retired now that
  Phases 80/85/90/91/95 have shipped; /iterate scores balanced
  again).

## Top 5 findings (scored)

### [8.1] Verify all tooltip content is 100% accurate (user-jot critique finding) ✅
- category: external-critique
- impact: 9
- ease: 9  
- next: audit all tooltip content for accuracy, fix any inaccuracies
- source: user
- observation: The tooltips look great but need verification that all information provided is 100% accurate. User spotted during testing at 2026-05-25.
- evidence: User-jot finding in plan/CRITIQUE.md "Verify all tooltip content is 100% accurate"
- suggested_fix: Systematically audit all tooltip content across SELF, Inventory, Memoir, Exploration and Combat surfaces to ensure accuracy
- issue: #217
- addressed: 2026-05-28 via commit `375c371`
- fix: Fixed mana→focus terminology inconsistency. Skill tooltips now show "focus cost" instead of "mana cost", combat action help updated from "costs mana" to "costs focus", and debug text standardized. All user-facing tooltip terminology now aligns with MIND stat's "focus" description.

### [7.5] Space heart/body/mind buttons evenly in combat modal (user-jot critique finding) ✅
- category: external-critique
- impact: 5
- ease: 9
- next: adjust button spacing in combat modal layout
- source: user
- observation: In the combat modal, heart/body/mind buttons should be spaced evenly instead of listing from the left. User spotted during testing at 2026-05-25.
- evidence: User-jot finding in plan/CRITIQUE.md "Space heart/body/mind buttons evenly in combat modal" + playtest finding [F07] (Mind stance card clipped at right edge)
- suggested_fix: Update combat modal CSS/styling to distribute stance buttons evenly across available width
- issue: #218
- addressed: 2026-05-28 via commit `341e2a9`
- fix: Added justifyContent: 'space-between' to stance button row layout in combat modal. Buttons now distribute evenly across available width instead of being left-aligned, resolving mind stance card clipping issue.

### [6.8] Show node labels only for unvisited, available nodes (user-jot critique finding) ✅
- category: external-critique  
- impact: 6
- ease: 8
- next: modify exploration map to conditionally show node labels based on state
- source: user
- observation: Map shows labels for all nodes, but should only display labels for nodes the player hasn't visited yet and are available as choices. User spotted during testing at 2026-05-25.
- evidence: User-jot finding in plan/CRITIQUE.md "Only show node labels for unvisited, available nodes"
- suggested_fix: Update exploration presenter to conditionally render node labels based on node state (unvisited + available only)
- issue: #219
- addressed: 2026-05-28 via commit `2c66e78`
- fix: Node labels now display conditionally - only for nodes with kind 'available' (unvisited + accessible). Wrapped label rendering in conditional check in MapNodeMarker component. Current, completed, and locked nodes show no label, reducing visual clutter and focusing attention on actionable choices.

### [4.5] Combat UX unintuitive, numbers and icons lack meaning (user-jot critique finding)
- category: external-critique
- impact: 9
- ease: 3
- next: requires design overhaul - defer to phase planning
- source: user  
- observation: Combat modal provides poor UX with unclear numbers and icons. User sees symbols but doesn't understand meaning. Requires design overhaul not code fix.
- evidence: User-jot finding + confirmed by PLAYTEST_REPORT.md findings [F02] (encounter jargon), [F04] (battle log ability names), [F05] (LET phase numbers), [F06] (CRUCIBLE symbols)
- suggested_fix: Needs design phase for complete combat UX overhaul

### [3.5] Morale bars render hardcoded placeholder values (needs engine backing) ✅
- category: data
- impact: 4
- ease: 7
- next: wait for engine morale system then wire to real state
- source: audit
- observation: Morale bar visible on WILDS StatusCard + SELF Pools section with hardcoded 7/10 values and placeholder BREAK threshold at 20%. Players see non-functional resource meter.
- evidence: Combat UX Boards design implementation 2026-05-27. Visual scaffolding shipped per design spec but not backed by engine data.
- suggested_fix: Once engine surfaces player.morale/player.moraleMax, wire StatusCard and character screen to read from useGameState
- addressed: 2026-06-01 via commit `958a2b7`
- fix: Wired morale displays to real engine state.moralMeter. StatusCard and character screen now read actual morale values, mapping engine range (-100 to +100) to display scale (1-10) with proper Roman numeral formatting and dynamic fill percentages. Preserves design break threshold at 20%. All existing tests pass.

### [2.5] Three console deprecation warnings from web bundle (LOW)
- category: tests
- impact: 2
- ease: 5
- next: wait for upstream fixes or implement workarounds
- source: audit
- observation: Deprecation warnings from transitive dependencies, not errors. Will become errors in future React Native/Expo version.
- evidence: Warnings reference textShadow* → textShadow, shadow* → boxShadow, props.pointerEvents → style.pointerEvents prop changes
- suggested_fix: Wait for upstream releases or implement prop name migration workarounds

### [2.0] Phase 72 acceptance — Playwright walkthrough against design prototype
- category: tests
- impact: 2 
- ease: 0
- next: user invokes /playtest after starting pnpm web
- source: audit
- observation: Visual-acceptance check needed on Phase 72 combat-modal polish that's already shipped. Requires user-started pnpm web.
- evidence: Filed by /ship-a-phase for design validation against design/handoff-2026-05-23/project/prototype.html
- suggested_fix: Cannot run autonomously - requires user to start web server then invoke /playtest

### [5.6] SVG icons missing accessibility labels ✅
- category: a11y
- impact: 8
- ease: 7
- next: add accessibilityRole and accessibilityLabel props to SVG components
- source: audit
- observation: Many SVG icons in ActionIcon.tsx, EffectGlyph.tsx, NodeMark.tsx, and tab icons lack accessibility attributes. Screen readers cannot interpret decorative/functional icons.
- evidence: Files like components/ActionIcon.tsx have inline SVG elements with no accessibility props
- suggested_fix: Add accessibilityRole="image" and descriptive accessibilityLabel props to all decorative SVGs, or accessibilityRole="none" for purely decorative elements
- issue: #223
- addressed: 2026-05-29 via commit `a19e33b`
- fix: Added accessibilityRole="image" and descriptive accessibilityLabel props to all SVG icons across ActionIcon.tsx, EffectGlyph.tsx, NodeMark.tsx, and TabIcon components. Screen readers now receive meaningful descriptions for all decorative and functional SVG elements, improving accessibility for visually impaired users.

### [4.0] Engine MapDefinition connectivity diverges from mobile layout (needs-engine-release)
- category: external-dependency
- impact: 8
- ease: 5  
- next: wait for engine MapDefinition.edges field release
- source: audit
- observation: Blocks migration from pre-built FSMA graphs to engine-driven MapDefinition.nodes. Exploration would get fresh maps automatically with engine updates.
- evidence: Mobile still uses manual layout fixtures instead of engine-driven maps per docs/engine-map-reconciliation-2026-05-24.md
- suggested_fix: Needs engine-side MapDefinition.edges field, then ~200 line refactor under state/exploration-maps/

### [3.0] Combat UX design §2/§3 completeness gap (needs-verify)
- category: tests
- impact: 5
- ease: 6
- next: verify Phase 98 implementation covers §2 iconography + §3 information hierarchy from design/combat-ux-overhaul.md; if gaps remain, file a follow-up phase
- source: oversight 44th call (2026-06-01)
- observation: design/combat-ux-overhaul.md specifies 3 implementation phases (terminology, iconography, information hierarchy). Phase 98 shipped terminology + iconography per its brief. §3 information hierarchy and §5 layout recommendations were not explicitly scheduled or verified shipped. The design doc's "Phase 99: Combat Information Hierarchy" was superseded by the Nexus guardrail phase.
- suggested_fix: /iterate should read §3/§5 of the design doc against current combat screen and confirm or file a gap phase.

### [user-issue #227] HIGH Token resource system never accumulates (blocks skill casting)
- category: external-issue
- impact: 9
- ease: 6
- next: /iterate will pick up; reference #227 in commit body.
- source: /critique pass 18 (user-jot finding)
- observation: The token resource system (what's used to cast skills) is not working at all — tokens are not accumulating whatsoever. Without them, skills cannot be cast.
- evidence: user-spotted at 2026-05-30T13:57:17Z (manual playtest)
- suggested_fix: verify the engine combatResources accrual per round is read/propagated to the mobile combat presenter (state/presenters/combat.engine.ts) rather than displayed as a static value; may be an engine vs mobile boundary issue.
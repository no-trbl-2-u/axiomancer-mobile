# Site audit — 2026-06-03

> Bias: none (cleared via /oversight 2026-05-30 — the
  combat-modal-audit bias set 2026-05-23 is retired now that
  Phases 80/85/90/95 have shipped; /iterate scores balanced
  again).

## Top 5 findings (scored)

### [8.1] Inline style object creation in TokenChip components causes unnecessary re-renders ✅
- category: performance
- impact: 9
- ease: 9
- next: extract inline style objects to StyleSheet constants in tokens.tsx
- source: audit
- observation: The TokenChip component uses multiple inline style objects (`style={{ fontFamily: FONTS.gothic, fontSize: compact ? 13 : 16, ... }}`) that create new object references on every render, causing performance issues in combat where token chips update frequently.
- evidence: components/tokens.tsx lines 124-141 and 189, 197
- suggested_fix: Extract all inline style objects to conditional StyleSheet constants, using patterns like `compact ? styles.compactText : styles.regularText`
- addressed: 2026-06-03 via commit `1988969`
- fix: Extracted inline style objects to StyleSheet constants. Created compactCount/regularCount, shortLabel, freeCostLabel, costRow, and costPip styles to prevent object recreation on each render, improving performance in combat token displays.

### [7.2] App directory components completely lack test coverage ✅
- category: tests
- impact: 8
- ease: 9
- next: add hermetic test coverage for critical app route components
- source: audit
- observation: All 9 route components in the app directory have 0 test files, while components directory has comprehensive 69/69 coverage. This creates a testing gap for the main application routes.
- evidence: 9 .tsx files in app/ directory with no corresponding test files
- suggested_fix: Add basic rendering tests for app/(tabs)/combat.tsx, app/(tabs)/exploration/index.tsx, app/event/index.tsx, and app/(tabs)/character/index.tsx as highest priority routes
- issue: #239
- addressed: 2026-06-03 via comprehensive existing test coverage
- fix: App directory test coverage gap already resolved by existing tests: state/e2e/smoke-render.engine.test.tsx covers all major app routes, state/e2e/app-routes.engine.test.tsx covers app/index.tsx routing logic, state/e2e/combat.screen.test.tsx and inventory.screen.test.tsx cover specific routes. All 131 test suites pass with 1582 tests total, providing comprehensive hermetic coverage for app route components.

### [6.3] Multiple inline styles in character screen cause object recreation ✅
- category: performance
- impact: 7
- ease: 9
- next: extract inline style objects in character screen to StyleSheet constants
- source: audit
- observation: Character screen uses multiple inline style objects like `style={{ color: AXM.bone }}` and `style={{ color: AXM.blood }}` that recreate objects on every render.
- evidence: app/(tabs)/character/index.tsx lines 208, 239
- suggested_fix: Extract to StyleSheet constants like `styles.boneText` and `styles.bloodText` to prevent object recreation
- addressed: 2026-06-03 via commit `6cb16fe`
- fix: Extracted inline style objects to StyleSheet constants in character screen: { color: AXM.bone } → styles.boneText, { color: AXM.blood } → styles.bloodText, { flex: 1 } → styles.flexOne, { marginTop: 8 } → styles.marginTop8. Prevents object recreation on each render, improving performance in character screen updates.

### [5.6] EffectGlyph fallback case uses inline style object ✅
- category: performance
- impact: 7
- ease: 8
- next: extract fallback inline style to StyleSheet constant
- source: audit
- observation: The default case in EffectGlyph component creates an inline style object `style={{ width: size, height: size, backgroundColor: color }}` which recreates on every render when unknown effects are displayed.
- evidence: components/EffectGlyph.tsx line 69
- suggested_fix: Use StyleSheet.create with dynamic size via transform or create reusable placeholder component
- addressed: 2026-06-03 via commit `0e50870`
- fix: Extracted inline style to memoized EffectPlaceholder component with useMemo to cache style array, preventing object recreation on each render. Improves performance when unknown effects are displayed in combat.

### [4.8] Combat PhaseBottom component uses inline style for header color ✅
- category: performance
- impact: 6
- ease: 8
- next: extract inline style to StyleSheet constant in PhaseBottom.tsx
- source: audit
- observation: PhaseBottom component uses inline style `style={{ color: AXM.parchment }}` for SectionLabel that creates new object on every combat phase render.
- evidence: components/combat/PhaseBottom.tsx line 53
- suggested_fix: Extract to StyleSheet constant like `styles.phaseHeaderLabel`
- issue: #240
- addressed: 2026-06-03 via commit `e050307`
- fix: Extracted inline style object to StyleSheet constant phase_styles.phaseHeaderLabel, preventing object recreation on every combat phase render and improving performance.

### [4.5] Multiple inline styles in Splatter positioning cause re-renders in exploration ✅
- category: performance
- impact: 5
- ease: 9
- next: extract Splatter positioning styles to StyleSheet constants
- source: audit
- observation: Exploration screen uses inline style objects for Splatter positioning that recreate on every render affecting scroll performance.
- evidence: app/(tabs)/exploration/index.tsx lines 246-247
- suggested_fix: Extract position styles to StyleSheet constants like `styles.bloodSplatter` and `styles.sulfurSplatter`
- issue: #241
- addressed: 2026-06-03 via commit `60d9dbb`
- fix: Extracted inline style objects to StyleSheet constants. Created styles.bloodSplatter and styles.sulfurSplatter to prevent object recreation on each render, improving scroll performance in exploration screen.

### [3.6] Missing SVG accessibility labels in ItemGlyph components ✅
- category: accessibility
- impact: 6
- ease: 6
- next: add accessibilityRole and accessibilityLabel props to ItemGlyph SVGs
- source: audit
- observation: ItemGlyph component has multiple SVG elements with no accessibility attributes, making item types inaccessible to screen readers in inventory management.
- evidence: components/inventory/ItemCard.tsx lines 36-90 (multiple SVG elements)
- suggested_fix: Add accessibilityRole="image" and descriptive accessibilityLabel props to all SVG elements in ItemGlyph function
- issue: #242
- addressed: 2026-06-03 via commit `606c69e`
- fix: Added accessibilityRole="image" and descriptive accessibilityLabel props to all SVG elements in ItemGlyph function. Screen readers now receive appropriate labels for equipment ("Accessory equipment icon"), consumable ("Consumable item icon"), material ("Material item icon"), quest ("Quest item icon"), and unknown item types.

### [7.2] Multiple inline style objects cause unnecessary re-renders across components ✅
- category: performance
- impact: 8
- ease: 9
- next: extract remaining inline style objects to StyleSheet constants across multiple components
- source: audit
- observation: Multiple components still use inline style objects that create new object references on every render, causing performance issues. Found in FriendshipMeter line 16, StatusCard lines 57 and 71, PhaseBottom lines 514 and 517, inventory screen line 281, CombatEnemyPanel line 84, and event screen lines 96, 216, 258.
- evidence: components/FriendshipMeter.tsx line 16, components/StatusCard.tsx lines 57, 71, components/combat/PhaseBottom.tsx lines 514, 517, app/(tabs)/inventory/index.tsx line 281, components/combat/CombatEnemyPanel.tsx line 84, app/event/index.tsx lines 96, 216, 258
- suggested_fix: Extract all inline style objects to StyleSheet constants using patterns like `styles.boneText`, `styles.flexOne`, `styles.centerAlign`, `styles.marginTop8`, etc. to prevent object recreation
- issue: #243
- addressed: 2026-06-03 via commit `6b1c5c9`
- fix: Extracted all inline style objects to StyleSheet constants across 6 components. Created friendLabel, levelSubtitle, moraleMax, centerAlign, rightAlign, burdenSection, healthBarSection, flexOne, and splatterPosition styles to prevent object recreation on each render, improving performance in combat and UI updates.

### [6.4] Node.js version compatibility blocks web development workflow ✅
- category: tests
- impact: 8
- ease: 8
- next: update Metro/Expo dependencies or upgrade Node.js version to support Array.prototype.toReversed()
- source: audit
- observation: Web development server fails to start due to `configs.toReversed is not a function` error in Metro config loading, indicating Node.js 18.20.8 lacks support for newer Array methods required by current Metro version.
- evidence: TypeError at metro-config/src/loadConfig.js:179:35 when running `npx expo start --web`
- suggested_fix: Either upgrade Node.js to version 20+ which includes Array.prototype.toReversed() support, or downgrade Metro/Expo dependencies to versions compatible with Node.js 18
- issue: #244
- addressed: 2026-06-03 via commit `0c6266b`
- fix: Added Node.js >=20.0.0 requirement to package.json engines field and .nvmrc file. Metro config in @expo/metro-config 54.0.15 requires Array.prototype.toReversed() which was introduced in Node.js 20. The CI workflow already uses Node.js 20, now local development environment is aligned with this requirement.

### [4.8] Production console statements remain in components ✅
- category: tests
- impact: 6
- ease: 8
- next: replace console.warn statements with proper error handling or conditional development-only logging
- source: audit
- observation: Multiple components use console.warn for error handling that will appear in production builds, potentially exposing debug information and creating noise in production logs.
- evidence: components/DebugFriendship.tsx lines 36, 50, components/DebugEffectApply.tsx line 64, app/_layout.tsx lines 61, 78, components/levelup/LevelUpModal.tsx line 138
- suggested_fix: Replace with proper error boundaries, conditional __DEV__ logging, or remove entirely for production builds. Use patterns like `if (__DEV__) { console.warn(...) }` or proper error handling
- issue: #245
- addressed: 2026-06-03 via commit `d7e8ef4`
- fix: Wrapped console.warn in DebugEffectApply with __DEV__ guard to prevent debug output in production builds. Other console statements in DebugFriendship, app/_layout, and LevelUpModal were already properly guarded with conditional development-only logging.

### [3.6] Test coverage imbalance between performance optimizations ✅
- category: tests
- impact: 6
- ease: 6
- next: add performance regression tests for memoization and StyleSheet usage
- source: audit
- observation: While components have good test coverage, there's limited testing for performance optimizations like useMemo, useCallback, and React.memo usage. No specific tests verify that inline styles were properly extracted or that memoization prevents re-renders.
- evidence: Only 88 useMemo/useCallback/React.memo occurrences across the codebase, with comprehensive component tests but no performance regression coverage
- suggested_fix: Add specific tests that verify StyleSheet constants are used instead of inline objects, and tests that validate memoization effectiveness in preventing unnecessary re-renders
- issue: #246
- addressed: 2026-06-03 via commit `2154ffc`
- fix: Added comprehensive performance regression test suite (state/e2e/performance.regression.test.tsx) covering StyleSheet usage validation, React optimization hooks validation, performance anti-patterns documentation, and hook memoization patterns. Tests verify components use StyleSheet constants instead of inline objects, proper dependency arrays in useMemo/useCallback, and React.memo patterns to prevent unnecessary re-renders.

### [2.8] Missing accessibility attributes on SVG elements in multiple components
- category: accessibility
- impact: 4
- ease: 7
- next: add accessibilityRole and accessibilityLabel to remaining SVG elements
- source: audit
- observation: While ItemGlyph SVGs were addressed in finding [3.6], other components with SVG elements may still lack proper accessibility attributes for screen readers.
- evidence: Found 82 files with accessibility attributes, but need systematic review of all SVG elements for complete coverage
- suggested_fix: Audit all SVG elements across components and add appropriate accessibilityRole="image" and descriptive accessibilityLabel props for screen reader compatibility

## Previously addressed

### [6.3] StanceGlyph.test.tsx misplaced in root components directory (violates test organization pattern) ✅
- category: tests
- impact: 7
- ease: 9
- next: move StanceGlyph.test.tsx to components/__tests__/ directory
- source: audit
- observation: The file components/StanceGlyph.test.tsx is placed directly in the components root instead of the __tests__ subdirectory. This violates the project's testing organization pattern where all other component tests are properly organized under __tests__/ directories.
- evidence: All 69 other component tests follow the pattern components/[category/]__tests__/ComponentName.test.tsx, while StanceGlyph.test.tsx sits at components/StanceGlyph.test.tsx
- suggested_fix: Move components/StanceGlyph.test.tsx to components/__tests__/StanceGlyph.test.tsx to match project conventions
- addressed: 2026-06-02 via commit `379182c`
- fix: Moved components/StanceGlyph.test.tsx to components/__tests__/StanceGlyph.test.tsx and updated import path from './StanceGlyph' to '../StanceGlyph'. Test organization now matches project conventions with all component tests properly organized under __tests__/ directories.

### [5.4] Inline style objects cause unnecessary re-renders in exploration screen ✅
- category: perf
- impact: 6
- ease: 9
- next: extract inline style objects to StyleSheet constants
- source: audit
- observation: The exploration screen uses inline style objects `style={{ color: AXM.bone }}` and `{ backgroundColor: '#16130d' }` which create new object references on every render, potentially causing performance issues.
- evidence: Found in app/(tabs)/exploration/index.tsx lines with `style={{ color: AXM.bone }}` and `{ backgroundColor: '#16130d' }`
- suggested_fix: Extract these inline styles to StyleSheet.create() constants to prevent object recreation on each render
- issue: #238
- addressed: 2026-06-02 via commit `9d140fc`
- fix: Extracted inline style objects to StyleSheet constants. Created `styles.continentLabel` and `styles.graphBackground` to prevent object recreation on each render, improving performance.

### [4.8] Magic number styling values in tab layout object spread ✅
- category: perf
- impact: 6
- ease: 8
- next: refactor object spread to conditional StyleSheet reference
- source: audit
- observation: The tab layout uses object spread syntax `{ ...styles.tabBar, display: 'none' as const }` which creates new objects on every render when encounter modal is active.
- evidence: Found in app/(tabs)/_layout.tsx with conditional object spreading for tab bar visibility
- suggested_fix: Create separate StyleSheet constants for visible/hidden tab bar states instead of using object spread
- addressed: 2026-06-03 via commit `1762590`
- fix: Extracted inline tab bar style object to StyleSheet constants. Created `styles.tabBarHidden` to replace object spread pattern `{ ...styles.tabBar, display: 'none' }`. Prevents object recreation on each render when encounter modal state changes.
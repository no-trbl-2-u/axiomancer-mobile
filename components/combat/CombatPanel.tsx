/**
 * Canonical import location for the combat surface (Phase 63a).
 *
 * The actual implementation lives in `app/(tabs)/combat.tsx` so
 * the tab screen + the modal-contained encounter (Phase 63b)
 * share one source of truth. This file re-exports the named
 * `CombatPanel` for callers that want a stable import path
 * outside the (tabs) route folder.
 *
 * Usage:
 *   import { CombatPanel } from '@/components/combat/CombatPanel';
 *   <YourContainer><CombatPanel /></YourContainer>
 *
 * `<CombatPanel />` returns the combat render (loading or
 * active) WITHOUT an outer `<ScreenBg>`. The caller is
 * responsible for the surrounding scrolling / safe-area
 * wrapper. The tab shell at `app/(tabs)/combat.tsx` wraps
 * in `<ScreenBg>`; the modal overlay (Phase 63b) wraps in its
 * own panel chrome.
 */

export { CombatPanel } from '@/app/(tabs)/combat';

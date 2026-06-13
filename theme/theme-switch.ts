/**
 * Runtime theme switching (visual-audit 2026-06).
 *
 * Because `AXM` is resolved once at module-load and baked into every
 * static `StyleSheet.create`, switching the active theme means
 * persisting the choice and reloading the bundle so `theme/axm.ts`
 * re-resolves. This module is the single entry point the dev switcher
 * (and, later, real region transitions) calls.
 *
 * Persistence is best-effort to both web `localStorage` (the sync
 * source the boot resolver reads) and `AsyncStorage` (native parity).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ACTIVE_THEME_ID } from './axm';
import { type ThemeId, THEME_STORAGE_KEY } from './palette';

export { ACTIVE_THEME_ID };

/** Persist `id` and reload so the new palette takes effect everywhere. */
export function setActiveTheme(id: ThemeId): void {
    // Web sync source of truth — the boot resolver reads this.
    try {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(THEME_STORAGE_KEY, id);
        }
    } catch {
        /* ignore */
    }
    // Native parity (and a same-session global override for any soft reload).
    try {
        (globalThis as { __AXM_THEME__?: ThemeId }).__AXM_THEME__ = id;
    } catch {
        /* ignore */
    }
    AsyncStorage.setItem(THEME_STORAGE_KEY, id).catch(() => {
        /* best-effort */
    });

    reloadApp();
}

function reloadApp(): void {
    // Web: a hard reload re-runs the bundle and re-resolves `AXM`.
    try {
        if (typeof window !== 'undefined' && window.location?.reload) {
            window.location.reload();
            return;
        }
    } catch {
        /* ignore */
    }
    // Native dev: DevSettings.reload() restarts the JS bundle.
    try {
        // Lazy require so web bundles don't pull it in unnecessarily.
        const { DevSettings } = require('react-native') as typeof import('react-native');
        DevSettings?.reload?.('theme switch');
    } catch {
        /* no-op in environments without a reload affordance */
    }
}

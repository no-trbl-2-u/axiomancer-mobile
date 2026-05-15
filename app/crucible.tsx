/**
 * Token Crucible route — modal-style tracker for the new five-token resource
 * system. The visible engine of skills depends on token combinations; this
 * screen is the explainer / dashboard until the engine plumbs tokens through
 * the combat HUD (ROADMAP gaps G and H).
 *
 * Presented as a fullscreen modal so it sits above the tab stack — same shape
 * as `app/event/index.tsx` (folder-shaped route, registered as a Stack.Screen
 * with `presentation: 'fullScreenModal'` in `app/_layout.tsx`).
 */

import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { AXM } from '@/theme/axm';
import { TokenCrucible } from '@/components/TokenCrucible';

export default function CrucibleScreen() {
    return (
        <SafeAreaView style={styles.safe}>
            <TokenCrucible showClose />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: AXM.bg,
    },
});

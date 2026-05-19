import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';

/**
 * Brief post-combat overlay banner rendered on the exploration screen
 * after a victorious / parley combat exits. Ported from the design's
 * `prototype.jsx::PtAftermathBanner` (lines 550-560) + the flow at
 * lines 65-77.
 *
 * Sits over the top of the exploration screen at `top: 56` so the
 * map remains visible behind. Sulfur 1px border on AXM.panelBg fill.
 * Auto-dismisses via the parent's `onDismiss` after `displayMs`
 * (default 2500ms per the prototype's `setTimeout(() => setModal(null),
 * 2500)`).
 *
 * Phase 41 port. The banner content (eyebrow / title / reward line /
 * subtitle) currently uses placeholder copy — engine integration to
 * surface real XP / loot / enemy name lives in a follow-up tick once
 * the engine exposes those fields. For now the banner ships as a
 * visible-but-generic acknowledgment.
 */

export interface AftermathBannerProps {
    /** Top-line eyebrow caption (chrome). Defaults to 'IT IS DONE'. */
    eyebrow?: string;
    /** Display title (gothic font). Defaults to a generic "The foe fell." */
    title?: string;
    /** Reward summary line (mono). Optional; omit when not surfaced. */
    rewards?: string | null;
    /** Italic subtitle below the rewards. Defaults to 'The map returns. Walk on.' */
    subtitle?: string;
    /** Auto-dismiss delay in ms. Default 2500 matches prototype.jsx. */
    displayMs?: number;
    /** Called when the auto-dismiss timer fires. */
    onDismiss: () => void;
}

export function AftermathBanner({
    eyebrow = 'IT IS DONE',
    title = 'The foe fell.',
    rewards = null,
    subtitle = 'The map returns. Walk on.',
    displayMs = 2500,
    onDismiss,
}: AftermathBannerProps) {
    useEffect(() => {
        const handle = setTimeout(onDismiss, displayMs);
        return () => clearTimeout(handle);
    }, [displayMs, onDismiss]);

    return (
        <View pointerEvents="none" style={styles.wrap} testID="aftermath-banner">
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            {rewards !== null && rewards.length > 0 && (
                <Text style={styles.rewards}>{rewards}</Text>
            )}
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        position: 'absolute',
        top: 56,
        left: 24,
        right: 24,
        padding: 16,
        backgroundColor: AXM.panelBg,
        borderWidth: 1,
        borderColor: AXM.sulfur,
        zIndex: 50,
    },
    eyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 10,
        color: AXM.sulfur,
        letterSpacing: 2.2,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 22,
        color: AXM.parchment,
        marginTop: 2,
    },
    rewards: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.parchment,
        marginTop: 6,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontFamily: FONTS.serifItalic,
        fontSize: 12,
        color: AXM.bone,
        marginTop: 4,
    },
});

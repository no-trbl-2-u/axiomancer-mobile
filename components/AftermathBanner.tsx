import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    Easing,
} from 'react-native-reanimated';
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
    /** Top-line eyebrow caption (chrome). Required — sourced from
     * `selectAftermathCopy(outcome)` per Hard Rule #8 (no display
     * literals at the view layer). */
    eyebrow: string;
    /** Display title (gothic font). Required — see eyebrow note. */
    title: string;
    /** Reward summary line (mono). Optional; omit when not surfaced. */
    rewards?: string | null;
    /** Italic subtitle. Required so the caller controls voice. */
    subtitle: string;
    /** Auto-dismiss delay in ms. Default 2500 matches prototype.jsx. */
    displayMs?: number;
    /** Called when the auto-dismiss timer fires. */
    onDismiss: () => void;
}

export function AftermathBanner({
    eyebrow,
    title,
    rewards = null,
    subtitle,
    displayMs = 2500,
    onDismiss,
}: AftermathBannerProps) {
    // Rise animation — Phase 44 port from prototype.jsx:632-638.
    // translateY 20 → 0 + opacity 0 → 1 over 280ms ease-out.
    const offset = useSharedValue(20);
    const opacity = useSharedValue(0);
    useEffect(() => {
        const timing = { duration: 280, easing: Easing.out(Easing.ease) };
        offset.value = withTiming(0, timing);
        opacity.value = withTiming(1, timing);
    }, [offset, opacity]);
    const animStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: offset.value }],
    }));

    useEffect(() => {
        // Screen-reader announcement (Phase 41 a11y close-out, critique
        // pass 16 LOW). pointerEvents='none' on the wrap can block
        // VoiceOver focus on iOS, and the 2500ms auto-dismiss means a
        // blind user otherwise gets no notification at all — fire a
        // one-shot announce alongside the dismiss timer.
        AccessibilityInfo.announceForAccessibility(`${eyebrow}. ${title}`);
        const handle = setTimeout(onDismiss, displayMs);
        return () => clearTimeout(handle);
    }, [displayMs, eyebrow, title, onDismiss]);

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.wrap, animStyle]}
            testID="aftermath-banner"
            accessibilityLiveRegion="polite"
            accessibilityLabel={`${eyebrow}. ${title}`}
        >
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title}</Text>
            {rewards !== null && rewards.length > 0 && (
                <Text style={styles.rewards}>{rewards}</Text>
            )}
            <Text style={styles.subtitle}>{subtitle}</Text>
        </Animated.View>
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

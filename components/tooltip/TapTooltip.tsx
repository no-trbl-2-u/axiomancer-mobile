/**
 * Visual primitive for the tap-tooltip system (Phase 74 Tick A).
 *
 * Pure presentational — receives positioned content and renders
 * the torn-edge panel. Anchor measurement + dismiss handling
 * live on the provider. The primitive's only job is to draw.
 *
 * Layout:
 * - Torn-edge panel (dashed 1px ash border on panel-bg) with
 *   12pt gothic uppercase title, lowercase chronicle body in
 *   IM Fell English, optional mono footnote for engine numbers.
 * - Max-width 280px; body wraps. No animation in Tick A
 *   (static mount matches a11y-default-static stance).
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';

export interface TapTooltipProps {
    title: string;
    body: string;
    footnote?: string;
    /**
     * Window-space coords from the provider's `measureInWindow`
     * + flip / clamp pass. Tick A renders as an absolutely-
     * positioned root-layer child (the provider's overlay).
     */
    left: number;
    top: number;
    testID?: string;
}

export function TapTooltip({ title, body, footnote, left, top, testID }: TapTooltipProps) {
    return (
        <View style={[styles.root, { left, top }]} testID={testID ?? 'tap-tooltip'}>
            <Text style={styles.title} testID="tap-tooltip-title">
                {title}
            </Text>
            <Text style={styles.body} testID="tap-tooltip-body">
                {body}
            </Text>
            {footnote ? (
                <Text style={styles.footnote} testID="tap-tooltip-footnote">
                    {footnote}
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        position: 'absolute',
        maxWidth: 280,
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: AXM.ash,
        backgroundColor: AXM.panelBg,
    },
    title: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        letterSpacing: 1.5,
        color: AXM.sulfur,
        marginBottom: 4,
    },
    body: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        lineHeight: 17,
        color: AXM.parchment,
    },
    footnote: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 4,
    },
});

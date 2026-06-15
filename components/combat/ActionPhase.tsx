import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { ActionIcon } from '@/components/ActionIcon';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import type { ActionOption } from '@/state/presenters/combat.engine';

export interface ActionPhaseProps {
    options: readonly ActionOption[];
    fleeAvailable: boolean;
    fleeHint: string;
    onPick: (k: ActionOption['key']) => void;
    onFlee: () => void;
}

export const ActionPhase = React.memo(function ActionPhase({
    options,
    fleeAvailable,
    fleeHint,
    onPick,
    onFlee,
}: ActionPhaseProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const ACCENT_BY_KIND: Record<ActionOption['accentKind'], string> = {
        blood: AXM.blood,
        parchment: AXM.parchment,
        sulfur: AXM.sulfur,
        rust: AXM.rust,
    };
    return (
        <View>
            <View style={styles.grid}>
                {options.map((opt) => {
                    const accent = ACCENT_BY_KIND[opt.accentKind];
                    
                    // Phase 95: Handle disabled ITEM button with tooltip
                    if (!opt.enabled && opt.key === 'item') {
                        return (
                            <TooltipTarget
                                key={opt.key}
                                kind="disabled-action"
                                id={opt.key}
                                style={[styles.cardTouch, { opacity: 0.45 }]}
                                accessibilityLabel={`${opt.label} unavailable`}
                                accessibilityHint="Tap for more information"
                                testID={`combat-action-${opt.key}-disabled-tooltip`}
                            >
                                <View style={[styles.card, { borderColor: accent }]}>
                                    <ActionIcon kind={opt.iconKind} size={32} color={accent} />
                                    <View style={styles.textCol}>
                                        <Text style={styles.label}>{opt.label}</Text>
                                        <Text style={styles.hint}>{opt.hint}</Text>
                                        <Text style={styles.statEffect}>{opt.statEffect}</Text>
                                    </View>
                                </View>
                            </TooltipTarget>
                        );
                    }

                    // Regular enabled actions (or other disabled actions without tooltips)
                    return (
                        <TouchableOpacity
                            key={opt.key}
                            onPress={() => onPick(opt.key)}
                            disabled={!opt.enabled}
                            style={[styles.cardTouch, !opt.enabled && { opacity: 0.45 }]}
                            testID={`combat-action-${opt.key}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Action ${opt.label}`}
                            accessibilityState={{ disabled: !opt.enabled }}
                        >
                            <View style={[styles.card, { borderColor: accent }]}>
                                <ActionIcon kind={opt.iconKind} size={32} color={accent} />
                                <View style={styles.textCol}>
                                    <Text style={styles.label}>{opt.label}</Text>
                                    <Text style={styles.hint}>{opt.hint}</Text>
                                    <Text style={styles.statEffect}>{opt.statEffect}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
            {fleeAvailable && (
                <TouchableOpacity
                    onPress={onFlee}
                    style={styles.fleeRow}
                    accessibilityRole="button"
                    accessibilityLabel="Flee combat"
                >
                    <Text style={styles.flee}>{fleeHint}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    cardTouch: {
        width: '48%',
        aspectRatio: 2.2,
        marginBottom: 8,
    },
    card: {
        flex: 1,
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 3,
        backgroundColor: AXM.bg,
        padding: 8,
        alignItems: 'center',
    },
    textCol: {
        flex: 1,
        marginLeft: 8,
    },
    label: {
        fontFamily: FONTS.gothic,
        fontSize: 10,
        color: AXM.parchment,
        textTransform: 'uppercase',
        letterSpacing: 1,
        lineHeight: 12,
        marginBottom: 2,
    },
    hint: {
        fontFamily: FONTS.serif,
        fontSize: 9,
        color: AXM.bone,
        lineHeight: 10,
        marginBottom: 2,
    },
    statEffect: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.ash,
        lineHeight: 10,
    },
    fleeRow: {
        marginTop: 8,
        marginHorizontal: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 3,
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    flee: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.bone,
        textAlign: 'center',
        fontStyle: 'italic',
    },
}));
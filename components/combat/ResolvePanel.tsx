import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type { ResolveSlice } from '@/state/presenters/combat.engine';
import { RollBar } from './RollBar';

export interface ResolvePanelProps {
    resolve: ResolveSlice;
    canContinue: boolean;
    onContinue: () => void;
    onLeave: () => void;
}

export function ResolvePanel({
    resolve,
    canContinue,
    onContinue,
    onLeave,
}: ResolvePanelProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const advColor =
        resolve.advantageKind === 'adv' ? AXM.sulfur
            : resolve.advantageKind === 'dis' ? AXM.blood
                : AXM.parchment;
    const isFriend = resolve.outcome === 'friendship';
    const isCrit = resolve.outcome === 'crit';
    const max = Math.max(resolve.playerRoll, resolve.enemyRoll, 20) + 4;

    useEffect(() => {
        if (isCrit) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (resolve.outcome === 'miss') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [isCrit, resolve.outcome]);

    return (
        <View style={styles.wrap}>
            {resolve.playerActionWasSkill ? (
                // Phase 127 — skills always hit and carry static,
                // mechanics-owned damage. The contested attack-roll
                // tracker would misrepresent that, so render a
                // deterministic doctrine banner (no dice imagery).
                <View style={styles.scaleBox} testID="combat-resolve-skill-result">
                    <View style={styles.skillResultHeader}>
                        <Text style={[styles.scaleEyebrow, { color: AXM.sulfur }]}>YOU · {resolve.playerStance.toUpperCase()}</Text>
                        <Text style={styles.scaleSubLabel}>DOCTRINE RESOLVES</Text>
                    </View>
                    <Text style={styles.skillResultText}>the technique lands as written.</Text>
                    <Text style={styles.verdictText}>{resolve.header.toLowerCase()}</Text>
                </View>
            ) : (
                <View style={styles.scaleBox}>
                    <View style={styles.scaleHeader}>
                        <View>
                            <Text style={[styles.scaleEyebrow, { color: AXM.sulfur }]}>YOU · {resolve.playerStance.toUpperCase()}</Text>
                            <Text style={styles.scaleSubLabel}>ATTACK ROLL</Text>
                        </View>
                        <View style={styles.centerAlign}>
                            <Text style={[styles.scaleEyebrow, { color: AXM.bone }]}>VS</Text>
                        </View>
                        <View style={styles.rightAlign}>
                            <Text style={[styles.scaleEyebrow, { color: AXM.blood }]}>FOE · {resolve.enemyStance.toUpperCase()}</Text>
                            <Text style={styles.scaleSubLabel}>FOE DEFENSE</Text>
                        </View>
                    </View>
                    <RollBar value={resolve.playerRoll} max={max} color={AXM.sulfur} label="YOU" />
                    <RollBar value={resolve.enemyRoll} max={max} color={AXM.blood} label="FOE" />
                    <Text style={styles.verdictText}>{resolve.header.toLowerCase()}</Text>
                </View>
            )}
            {isCrit && (
                <Text style={styles.critFlag}>CRIT — DOUBLE</Text>
            )}
            <View style={styles.ripplesBox}>
                <Text style={styles.ripplesEyebrow}>RIPPLES</Text>
                <View style={styles.rippleRow}>
                    <Text style={[styles.rippleValue, { color: advColor }]}>{resolve.primaryText}</Text>
                    <Text style={styles.rippleDesc}>{resolve.message}</Text>
                </View>
            </View>
            <TouchableOpacity
                onPress={canContinue ? onContinue : onLeave}
                style={[styles.letBtn, { borderColor: isFriend ? AXM.rust : AXM.sulfur }]}
                testID="combat-resolve-continue"
                accessibilityRole="button"
                accessibilityLabel={canContinue ? 'Continue to next round' : 'Leave combat'}
            >
                <Text style={[styles.letText, { color: isFriend ? AXM.rust : AXM.sulfur }]}>
                    {resolve.nextActionLabel}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    wrap: {
        paddingHorizontal: 8,
    },
    scaleBox: {
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderRadius: 3,
        padding: 12,
        marginBottom: 8,
    },
    scaleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    skillResultHeader: {
        marginBottom: 10,
    },
    skillResultText: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.bone,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    centerAlign: {
        alignItems: 'center',
    },
    rightAlign: {
        alignItems: 'flex-end',
    },
    scaleEyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    scaleSubLabel: {
        fontFamily: FONTS.sans,
        fontSize: 7,
        color: AXM.ash,
        letterSpacing: 0.5,
    },
    verdictText: {
        fontFamily: FONTS.serif,
        fontSize: 13,
        color: AXM.parchment,
        textAlign: 'center',
        marginTop: 8,
        fontStyle: 'italic',
    },
    critFlag: {
        fontFamily: FONTS.sans,
        fontSize: 11,
        color: AXM.sulfur,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 8,
    },
    ripplesBox: {
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.ash,
        borderRadius: 3,
        padding: 12,
        marginBottom: 12,
    },
    ripplesEyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.ash,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    rippleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rippleValue: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        fontWeight: '700',
        marginRight: 8,
        minWidth: 32,
    },
    rippleDesc: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.bone,
        flex: 1,
        fontStyle: 'italic',
    },
    letBtn: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderRadius: 3,
        backgroundColor: AXM.bg,
    },
    letText: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
}));
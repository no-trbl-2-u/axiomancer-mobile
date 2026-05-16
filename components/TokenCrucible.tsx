/**
 * Token Crucible — standalone tracker / explainer for the new resource system.
 *
 * Shows: current pool (big chips), accrual rules (how each token is earned),
 * the full 12-skill cost grid with castable-now highlighting, and a legend
 * key. Pure UI — caller supplies `tokens`; defaults to a mid-round mix.
 *
 * Ported from `axiomancer/project/screens/tokens.jsx#TokenCrucible` in the
 * design handoff, adapted to React Native.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { AXM, FONTS } from '@/theme/axm';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { TokenIcon, TokenCost } from '@/components/tokens';
import {
    TOKEN,
    type TokenCounts,
    type TokenKey,
} from '@/state/mocks/tokens.fixture';
import {
    selectTokenCrucibleViewModel,
    CRUCIBLE_STANCE_ORDER,
} from '@/state/presenters/token-crucible.engine';

export interface TokenCrucibleProps {
    tokens?: Partial<TokenCounts>;
    /** Show a "close" affordance in the top-right (used when rendered as a route). */
    showClose?: boolean;
}

const DEFAULT_POOL: TokenCounts = { body: 2, mind: 1, heart: 2, fallacy: 1, paradox: 1 };

export function TokenCrucible({ tokens = DEFAULT_POOL, showClose = false }: TokenCrucibleProps) {
    const router = useRouter();
    // Normalize partial-pool input to a full TokenCounts then build the VM.
    // The presenter handles the per-stance partition + castable-now check.
    const pool: TokenCounts = { body: 0, mind: 0, heart: 0, fallacy: 0, paradox: 0, ...tokens };
    const vm = selectTokenCrucibleViewModel(pool);

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            {/* HEADER */}
            <View style={styles.headerRow}>
                <SectionLabel size={11}>✠ TOKEN CRUCIBLE</SectionLabel>
                {showClose && (
                    <Pressable onPress={() => router.back()} hitSlop={12}>
                        <Text style={styles.closeBtn}>✕</Text>
                    </Pressable>
                )}
            </View>
            <Text style={styles.subhead}>replaces MP · engine: Skill.resourceCost</Text>
            <Text style={styles.intro}>
                Five resources accrue during combat. Each skill demands a unique combination —
                not a single mana number — so the round you spend &quot;earning your tokens&quot; is part
                of the dance.
            </Text>

            {/* CURRENT POOL */}
            <SectionLabel size={9} style={styles.boneLabel}>CURRENT POOL</SectionLabel>
            <View style={styles.poolBox}>
                {vm.tokenKeys.map((k: TokenKey) => {
                    const count = vm.pool[k];
                    const owned = count > 0;
                    const color = owned ? TOKEN[k].color : AXM.bone;
                    return (
                        <View key={k} style={styles.poolCol}>
                            <View
                                style={[
                                    styles.poolCell,
                                    {
                                        backgroundColor: owned ? TOKEN[k].bg : '#0a0a0a',
                                        borderColor: owned ? TOKEN[k].color : AXM.ash,
                                    },
                                ]}
                            >
                                <TokenIcon kind={k} size={26} color={color} />
                                <Text style={[styles.poolCount, { color }]}>{count}</Text>
                                <Text style={[styles.poolLabel, { color }]}>{TOKEN[k].label}</Text>
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* RULES */}
            <SectionLabel size={9} style={styles.boneLabel}>HOW TOKENS ACCRUE</SectionLabel>
            <View style={styles.rulesBox}>
                {vm.rules.map((rule, i) => (
                    <View
                        key={i}
                        style={[
                            styles.ruleRow,
                            i < vm.rules.length - 1 && styles.ruleRowDivider,
                        ]}
                    >
                        <View
                            style={[
                                styles.ruleIcon,
                                { backgroundColor: rule.meta.bg, borderColor: rule.meta.color },
                            ]}
                        >
                            <TokenIcon kind={rule.kind} size={10} color={rule.meta.color} />
                        </View>
                        <Text style={styles.ruleWhen}>{rule.when}</Text>
                        <Text style={[styles.ruleAmount, { color: rule.meta.color }]}>{rule.amount}</Text>
                    </View>
                ))}
            </View>

            {/* SKILL GRID */}
            <SectionLabel size={9} style={styles.boneLabel}>SKILL COSTS · 12 SKILLS</SectionLabel>
            <View style={styles.gridBox}>
                {CRUCIBLE_STANCE_ORDER.map((stance, si) => (
                    <View
                        key={stance}
                        style={[
                            styles.gridStance,
                            si < 2 && styles.gridStanceDivider,
                        ]}
                    >
                        <View style={styles.gridStanceHead}>
                            <StanceGlyph kind={stance} size={14} color={AXM.parchment} />
                            <SectionLabel size={9} style={{ color: AXM.parchment }}>
                                {stance.toUpperCase()} STANCE
                            </SectionLabel>
                        </View>
                        {vm.skillsByStance[stance].map((s) => {
                            const afford = s.castableNow;
                            // TokenCost still needs the raw cost shape; reconstruct
                            // from cost entries for the chip component.
                            const costRecord: Partial<TokenCounts> = {};
                            for (const e of s.costEntries) {
                                costRecord[e.kind] = e.amount;
                            }
                            return (
                                <View
                                    key={s.id}
                                    style={[
                                        styles.skillRow,
                                        {
                                            backgroundColor: afford ? '#0d0a06' : 'transparent',
                                            borderColor: afford ? AXM.sulfur : AXM.ash,
                                            opacity: afford ? 1 : 0.7,
                                        },
                                    ]}
                                >
                                    <View style={styles.skillNameRow}>
                                        <Text style={styles.skillTier}>T{s.tier}</Text>
                                        <Text
                                            style={[
                                                styles.skillName,
                                                { color: afford ? AXM.sulfur : AXM.parchment },
                                            ]}
                                            numberOfLines={1}
                                        >{s.name}</Text>
                                    </View>
                                    <TokenCost cost={costRecord} tokens={vm.pool} size={11} dense />
                                </View>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* LEGEND */}
            <View style={styles.legendRow}>
                <Text style={styles.legendLabel}>LEGEND:</Text>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: TOKEN.body.bg, borderColor: AXM.sulfur }]} />
                    <Text style={styles.legendText}>OWNED</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: 'transparent', borderColor: AXM.bone, borderStyle: 'dashed' }]} />
                    <Text style={styles.legendText}>OWED</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendSwatch, { backgroundColor: '#0d0a06', borderColor: AXM.sulfur }]} />
                    <Text style={styles.legendText}>CASTABLE NOW</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: AXM.bg,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    closeBtn: {
        fontFamily: FONTS.mono,
        fontSize: 16,
        color: AXM.parchment,
        paddingHorizontal: 6,
    },
    subhead: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.bone,
        letterSpacing: 1,
        marginBottom: 8,
    },
    intro: {
        fontFamily: FONTS.serifItalic,
        fontStyle: 'italic',
        fontSize: 12,
        color: AXM.bone,
        lineHeight: 16,
        marginBottom: 14,
    },
    boneLabel: {
        color: AXM.bone,
        marginBottom: 4,
        marginTop: 12,
    },
    // Current pool
    poolBox: {
        flexDirection: 'row',
        gap: 6,
        padding: 8,
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    poolCol: {
        flex: 1,
        alignItems: 'center',
    },
    poolCell: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderWidth: 1.5,
        minWidth: 56,
    },
    poolCount: {
        fontFamily: FONTS.gothic,
        fontSize: 26,
        lineHeight: 28,
        marginTop: 2,
    },
    poolLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 2,
        marginTop: 2,
    },
    // Rules
    rulesBox: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: AXM.ash,
        padding: 10,
    },
    ruleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 5,
    },
    ruleRowDivider: {
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
    },
    ruleIcon: {
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    ruleWhen: {
        flex: 1,
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.parchment,
        lineHeight: 14,
    },
    ruleAmount: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        letterSpacing: 1,
    },
    // Skill grid
    gridBox: {
        backgroundColor: '#0a0a0a',
        borderWidth: 1,
        borderColor: AXM.ash,
        padding: 10,
    },
    gridStance: {
        marginBottom: 8,
        paddingBottom: 6,
    },
    gridStanceDivider: {
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        borderStyle: 'dashed',
    },
    gridStanceHead: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    skillRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 6,
        marginBottom: 4,
        borderWidth: 1,
    },
    skillNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        marginRight: 6,
    },
    skillTier: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1,
    },
    skillName: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        lineHeight: 14,
        flexShrink: 1,
    },
    // Legend
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        alignItems: 'center',
        marginTop: 14,
    },
    legendLabel: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1,
        color: AXM.bone,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendSwatch: {
        width: 14,
        height: 14,
        borderWidth: 1,
    },
    legendText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        color: AXM.parchment,
    },
});

import React from 'react';
import {
    Text,
    View,
} from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import type { CombatViewModel, StanceKey } from '@/state/presenters/combat.engine';
import { StatBar } from '@/components/StatBar';
import { EffectChip } from '@/components/EffectChip';
import { FriendshipMeter } from '@/components/FriendshipMeter';
import { MindMark } from '@/components/MindMark';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { Splatter } from '@/components/Splatter';
import { StanceGlyph } from '@/components/StanceGlyph';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';

interface CombatEnemyPanelProps {
    vm: CombatViewModel;
}

export const CombatEnemyPanel = React.memo(function CombatEnemyPanel({ vm }: CombatEnemyPanelProps) {
    const styles = useStyles();
    const AXM = usePalette();
    const lastStance: StanceKey = vm.enemy.lastStance ?? 'mind';
    // Phase 72 — restructured to the design's left-portrait pattern
    // (`design/handoff-2026-05-23/project/screens-canonical.jsx:213-243`).
    // Three columns: 60×72 framed portrait left, info column middle (flex),
    // STANDS-stance indicator right. Pre-Phase-72 the SVG was a 180×200
    // off-bleed overlay on the right — the user-reported "cleaner placing
    // of the enemy's image/svg" addressed.
    return (
        <View style={styles.enemyPanel}>
            <Splatter
                color={AXM.blood}
                size={100}
                seed={17}
                style={{ position: 'absolute', top: -16, left: -16, opacity: 0.5 }}
            />
            <View style={styles.enemyRow}>
                <View style={styles.enemyPortrait}>
                    {/* Bespoke archetype portrait keyed off the enemy id so the
                        fight HUD matches the prelude art (visual-audit 2026-06). */}
                    <EnemyPortrait
                        enemyArtKey={vm.enemy.artKey}
                        isBoss={vm.enemy.tier === 'boss'}
                        width={58}
                        height={70}
                        label={`Enemy portrait: ${vm.enemy.name || 'Unknown enemy'}`}
                    />
                </View>
                <View style={styles.enemyInfo}>
                    <View style={styles.enemyTopRow}>
                        <Text style={styles.enemyEyebrow}>WHAT WAITS</Text>
                        <View style={{ flex: 1 }} />
                        <DifficultyBadge tier={vm.enemy.tier || 'normal'} />
                        <Text style={styles.roundText}>{vm.roundToken}</Text>
                    </View>
                    <Text style={styles.enemyName} numberOfLines={1}>{vm.enemy.name}</Text>
                    {vm.enemy.flavor !== '' && (
                        <Text style={styles.enemyFlavor} numberOfLines={1}>
                            {`"…${vm.enemy.flavor}"`}
                        </Text>
                    )}
                    <View style={styles.healthBarSection}>
                        <StatBar
                            value={vm.enemy.hp}
                            max={vm.enemy.hpMax}
                            color={AXM.blood}
                            label="VITAE"
                            height={8}
                        />
                    </View>
                    <View style={styles.enemyMetaRow}>
                        <FriendshipMeter value={vm.friendshipCounter} max={vm.friendshipCounterMax} />
                        <MindMark stacks={vm.enemy.mindMarks} />
                    </View>
                    {vm.enemy.effects.length > 0 && (
                        <View style={styles.effectsRow}>
                            {vm.enemy.effects.map((e, i) => (
                                <TooltipTarget
                                    key={`${e.kind}-${i}`}
                                    kind="effect"
                                    id={e.effectId}
                                    accessibilityLabel={`Effect ${e.name}`}
                                    accessibilityHint="tap to read description"
                                    testID={`combat-enemy-effect-${i}`}
                                >
                                    <EffectChip
                                        effect={{
                                            ...e,
                                            tint: e.tint ?? undefined,
                                            duration: e.duration ?? undefined,
                                        }}
                                    />
                                </TooltipTarget>
                            ))}
                        </View>
                    )}
                </View>
                <View style={styles.enemyStanceCol}>
                    <Text style={styles.enemyStanceLabel}>STANDS</Text>
                    <StanceGlyph
                        kind={lastStance}
                        size={28}
                        color={vm.enemy.lastStance === null ? AXM.bone : AXM.sulfur}
                    />
                </View>
            </View>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    // Phase 72 — three-column EnemyPanel layout matching the design's
    // PtCombatBody EnemyPanel (`screens-canonical.jsx:213-243`).
    // Portrait left (60×72 framed), info middle (flex), stance indicator
    // right. Pre-Phase-72 layout was an off-bleed right-aligned SVG with
    // info absolute-positioned left — surface still rendered as the
    // overlapped collage the user flagged for cleanup.
    enemyPanel: {
        position: 'relative',
        padding: 10,
        paddingHorizontal: 16,
        backgroundColor: AXM.panelBg,
        overflow: 'hidden',
    },
    enemyRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    enemyPortrait: {
        width: 60,
        height: 72,
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
        // Subtle hatch via thin internal stripe — react-native doesn't
        // ship the `axm-hatch` CSS class the design uses, but the
        // bordered+deepBg backdrop carries the visual contract.
    },
    enemyInfo: { flex: 1, minWidth: 0 },
    enemyEyebrow: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.8,
        color: AXM.bone,
    },
    enemyTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 2,
    },
    roundText: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    enemyName: {
        fontFamily: FONTS.gothic,
        fontSize: 20,
        lineHeight: 22,
        color: AXM.parchment,
        marginTop: 2,
    },
    enemyFlavor: {
        fontFamily: FONTS.serifItalic,
        fontSize: 10,
        color: AXM.bone,
        marginTop: 2,
    },
    enemyMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 5,
    },
    effectsRow: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 5,
        flexWrap: 'wrap',
    },
    enemyStanceCol: {
        alignItems: 'center',
        gap: 4,
        paddingTop: 2,
    },
    enemyStanceLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        letterSpacing: 1.6,
        color: AXM.bone,
    },
    healthBarSection: {
        marginTop: 6,
    },
}));
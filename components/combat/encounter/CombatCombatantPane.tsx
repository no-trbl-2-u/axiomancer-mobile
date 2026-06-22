/**
 * Spec 26 §4.3 + 26b — the combatant pane. Replaces the Hazard crisis strip.
 *
 * Enemy (left) and player (right) side by side, each with a PORTRAIT, a visible
 * HP bar, and big legible STATUS-EFFECT chips (the doctrine: status effects are
 * the main fun and must be front-and-centre). The enemy side adds the INTENT
 * telegraph and the hidden-STANCE read: a "?" plus the thematic tell until the
 * stance is revealed, then the stance colour + label.
 */

import React from 'react';
import { Pressable, Text, View } from 'react-native';

import { EnemyPortrait } from '@/components/event/enemy-art/EnemyPortrait';
import { PlayerPortrait } from '@/components/art/PlayerPortrait';
import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import type {
    CombatEnemyPaneVM, CombatPlayerPaneVM, CombatEffectChipVM,
} from '@/state/presenters/combat-encounter.engine';
import { IntentIcon } from './IntentIcon';

function HpBar({ pct, value, max, color }: { pct: number; value: number; max: number; color: string }) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.hpWrap} accessible accessibilityRole="progressbar" accessibilityLabel={`Health ${value} of ${max}`} accessibilityValue={{ min: 0, max, now: value }}>
            <View style={styles.hpTrack}>
                <View style={[styles.hpFill, { width: `${Math.round(pct * 100)}%`, backgroundColor: color }]} />
            </View>
            <Text style={[styles.hpText, { color: AXM.parchment }]}>♥ {value}<Text style={{ color: AXM.bone }}> / {max}</Text></Text>
        </View>
    );
}

function EffectChips({ effects, onChip, emptyLabel }: { effects: CombatEffectChipVM[]; onChip?: (e: CombatEffectChipVM) => void; emptyLabel: string }) {
    const styles = useStyles();
    if (effects.length === 0) return <Text style={styles.noEffects}>{emptyLabel}</Text>;
    return (
        <View style={styles.chipRow}>
            {effects.map((e) => (
                <Pressable
                    key={e.effectId}
                    onPress={() => onChip?.(e)}
                    style={[styles.chip, { borderColor: `${e.glyph.color}aa` }]}
                    testID={`combat-effect-${e.effectId}`}
                    accessibilityRole="button"
                    accessibilityLabel={`${e.glyph.label}, intensity ${e.intensity}, ${e.duration} turns left${e.isMax ? ', maxed' : ''}`}
                >
                    <Text style={[styles.chipGlyph, { color: e.glyph.color }]}>{e.glyph.glyph}</Text>
                    <Text style={[styles.chipNum, { color: e.glyph.color }]}>{e.isMax ? 'MAX' : `×${e.intensity}`}</Text>
                    <Text style={styles.chipDur}>{e.duration}t</Text>
                </Pressable>
            ))}
        </View>
    );
}

export function CombatCombatantPane({
    enemy, player, conviction, onChip,
}: {
    enemy: CombatEnemyPaneVM;
    player: CombatPlayerPaneVM;
    conviction: number;
    onChip?: (e: CombatEffectChipVM) => void;
}) {
    const AXM = usePalette();
    const styles = useStyles();
    return (
        <View style={styles.pane} testID="combat-combatant-pane">
            {/* ENEMY */}
            <View style={styles.side}>
                <View style={styles.headRow}>
                    <View style={[styles.portraitFrame, { borderColor: enemy.stanceColor }]}>
                        <EnemyPortrait enemyArtKey={enemy.artKey} isBoss={enemy.isBoss} width={52} height={62} label={`${enemy.name} portrait`} />
                    </View>
                    <View style={styles.headText}>
                        <Text style={styles.name} numberOfLines={1}>{enemy.name}</Text>
                        <IntentIcon intent={enemy.intent} />
                    </View>
                </View>
                <HpBar pct={enemy.hpPct} value={enemy.hp} max={enemy.maxHp} color={AXM.blood} />
                {/* hidden-stance read */}
                <View style={styles.stanceRow}>
                    <Text style={[styles.stanceBadge, { color: enemy.revealedStance ? enemy.stanceColor : AXM.bone, borderColor: enemy.revealedStance ? enemy.stanceColor : AXM.ash }]}>
                        🜲 {enemy.stanceLabel}
                    </Text>
                    {!enemy.revealedStance && enemy.stanceHint ? (
                        <Text style={styles.tell} numberOfLines={3}>🔍 {enemy.stanceHint}</Text>
                    ) : null}
                </View>
                <EffectChips effects={enemy.effects} onChip={onChip} emptyLabel="▸ land DoT / Control to erode them" />
            </View>

            <View style={styles.divider} />

            {/* PLAYER */}
            <View style={styles.side}>
                <View style={styles.headRow}>
                    <View style={[styles.portraitFrame, { borderColor: AXM.sulfur }]}>
                        <PlayerPortrait width={52} height={62} />
                    </View>
                    <View style={styles.headText}>
                        <Text style={styles.name} numberOfLines={1}>{player.name}</Text>
                        <Text style={[styles.conviction, { color: AXM.sulfur }]} testID="combat-conviction">◆ {conviction} CONVICTION</Text>
                    </View>
                </View>
                <HpBar pct={player.hpPct} value={player.hp} max={player.maxHp} color="#5bbf6a" />
                <View style={styles.stanceRow}><Text style={styles.youLabel}>your status</Text></View>
                <EffectChips effects={player.effects} onChip={onChip} emptyLabel="clear — no debuffs on you" />
            </View>
        </View>
    );
}

const useStyles = makeStyles((AXM) => ({
    pane: { flexDirection: 'row', backgroundColor: 'rgba(8,6,5,0.9)', borderBottomWidth: 1, borderBottomColor: AXM.ash, paddingHorizontal: 8, paddingVertical: 7, minHeight: 146 },
    side: { flex: 1, paddingHorizontal: 4 },
    divider: { width: 1, backgroundColor: AXM.ash, marginHorizontal: 2 },
    headRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    portraitFrame: { borderWidth: 2, borderRadius: 4, padding: 1, backgroundColor: AXM.deepBg },
    headText: { flex: 1 },
    name: { fontFamily: FONTS.gothic, fontSize: 15, color: AXM.parchment, letterSpacing: 0.4 },
    conviction: { fontFamily: FONTS.mono, fontSize: 11, letterSpacing: 0.6, marginTop: 3 },
    hpWrap: { marginTop: 5 },
    hpTrack: { height: 9, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: AXM.ash, overflow: 'hidden' },
    hpFill: { height: '100%' },
    hpText: { fontFamily: FONTS.mono, fontSize: 11, marginTop: 2 },
    stanceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 4, minHeight: 40 },
    stanceBadge: { fontFamily: FONTS.sans, fontSize: 12, letterSpacing: 1, borderWidth: 1, paddingHorizontal: 5, paddingVertical: 1, overflow: 'hidden' },
    tell: { flex: 1, fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 11, color: AXM.parchment, lineHeight: 13 },
    youLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.ash },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4, minHeight: 24 },
    noEffects: { fontFamily: FONTS.serifItalic, fontStyle: 'italic', fontSize: 10, color: AXM.ash, marginTop: 6 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 2, borderWidth: 1, borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2, backgroundColor: 'rgba(0,0,0,0.4)' },
    chipGlyph: { fontSize: 13 },
    chipNum: { fontFamily: FONTS.mono, fontSize: 10, letterSpacing: 0.3 },
    chipDur: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
}));

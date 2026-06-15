import React from 'react';
import {
    View,
} from 'react-native';

import { makeStyles, usePalette } from '@/theme/runtime';
import type { CombatViewModel } from '@/state/presenters/combat.engine';
import { StatBar } from '@/components/StatBar';
import { StanceGlyph } from '@/components/StanceGlyph';
import { FriendshipMeter } from '@/components/FriendshipMeter';
import { EffectChip } from '@/components/EffectChip';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { CombatResourceTracker } from '@/components/combat/CombatResourceTracker';

interface CombatPlayerHudProps {
    vm: CombatViewModel;
}

export const CombatPlayerHud = React.memo(function CombatPlayerHud({ vm }: CombatPlayerHudProps) {
    const styles = useStyles();
    const AXM = usePalette();
    // Phase 73 — port the design's PlayerHUDLive (`prototype.jsx:
    // 452-472`). Sits at the bottom of the seal as a "your turn"
    // footer: stance glyph on the left (sulfur when a stance is
    // committed, bone otherwise), then a column on the right with
    // the VITAE bar across the top and the friendship meter +
    // effect chips on the bottom row. Mana bar omitted per user-
    // direct override (2026-05-23) — only VITAE is player-visible.
    const stance = vm.stancePicker.selected;
    // The crucible resource tracker (skill fuel) sits at the top of the
    // footer so the pool stays visible in every phase. Guarded because
    // some hermetic fixtures render the HUD without a `crucibleTokens`
    // slice; the live VM always provides one.
    const tokens = vm.crucibleTokens;
    return (
        <View style={styles.playerWrap}>
            {tokens && tokens.length > 0 && <CombatResourceTracker tokens={tokens} />}
            <View style={styles.playerInner}>
                <StanceGlyph
                    kind={stance ?? 'body'}
                    size={26}
                    color={stance !== null ? AXM.sulfur : AXM.bone}
                />
                <View style={styles.playerCol}>
                    <StatBar value={vm.player.hp} max={vm.player.hpMax} color={AXM.blood} label="VITAE" height={8} />
                    <View style={styles.playerMetaRow}>
                        <FriendshipMeter
                            value={vm.friendshipCounter}
                            max={vm.friendshipCounterMax}
                        />
                        <View style={{ flex: 1 }} />
                        <View style={styles.playerEffects}>
                            {vm.player.effects.map((e, i) => (
                                <TooltipTarget
                                    key={`${e.kind}-${i}`}
                                    kind="effect"
                                    id={e.effectId}
                                    accessibilityLabel={`Effect ${e.name}`}
                                    accessibilityHint="tap to read description"
                                    testID={`combat-player-effect-${i}`}
                                >
                                    <EffectChip
                                        effect={{ ...e, tint: e.tint ?? undefined, duration: e.duration ?? undefined }}
                                    />
                                </TooltipTarget>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    // Phase 73 — design's PlayerHUDLive frame (`prototype.jsx:454`).
    // Sits at the bottom of the seal with a deepBg fill + 1px
    // borderTop, padding 8x16. The stance glyph sits left, content
    // column right.
    playerWrap: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: AXM.ash, backgroundColor: AXM.deepBg },
    playerInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    playerCol: { flex: 1, flexDirection: 'column', gap: 4 },
    playerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    playerEffects: { flexDirection: 'row', gap: 3 },
}));
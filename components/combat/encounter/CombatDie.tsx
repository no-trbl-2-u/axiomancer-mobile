/**
 * Spec 26b §1 — a stance die. The 2-die-per-turn draft pool renders these:
 * tap one to draft it as your STANCE (the other converts to Conviction).
 *
 * A rounded die face carrying the stance glyph (♥ ⚡ ★ ✦ ✕) and colour. The
 * drafted die glows and is ringed; an unpicked die dims with a "→ ◆" tag; an X
 * face reads as blocked. Colour is paired with the glyph so it is never the only
 * channel (a11y).
 */

import React from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { CombatDieVM } from '@/state/presenters/combat-encounter.engine';

export function CombatDie({ die, size = 54, dimmed = false }: { die: CombatDieVM; size?: number; dimmed?: boolean }) {
    const styles = useStyles();
    const accent = die.colorHex;
    const ring = die.drafted ? accent : die.isX ? '#3a3a3a' : `${accent}88`;
    const bg = die.drafted ? `${accent}2e` : 'rgba(0,0,0,0.45)';
    return (
        <View
            testID={`combat-die-${die.id}`}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${die.stanceLabel} stance die${die.drafted ? ', drafted as your stance' : die.isX ? ', blocked' : ', available to draft'}`}
            style={[
                styles.die,
                {
                    width: size, height: size, borderRadius: size * 0.22,
                    borderColor: ring, backgroundColor: bg,
                    opacity: dimmed && !die.drafted ? 0.5 : 1,
                    shadowColor: accent, shadowOpacity: die.drafted ? 0.85 : 0,
                },
            ]}
        >
            <Text style={[styles.glyph, { color: die.isX ? '#8a8273' : accent, fontSize: size * 0.42 }]}>{die.glyph}</Text>
            <Text style={[styles.label, { color: die.isX ? '#8a8273' : accent }]}>{die.stanceLabel}</Text>
        </View>
    );
}

const useStyles = makeStyles(() => ({
    die: {
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
        shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6,
    },
    glyph: { lineHeight: undefined, textAlign: 'center' },
    label: { fontFamily: FONTS.sans, fontSize: 9, letterSpacing: 1, marginTop: 1 },
}));

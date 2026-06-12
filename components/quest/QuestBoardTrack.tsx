/**
 * Quest board track — the loop of spaces drawn as a ring around the
 * board's center well. Pure presentation: renders `QuestSpaceVM[]`
 * and the piece marker; the center well is a slot for the roll
 * control and parts ledger.
 *
 * Geometry: spaces walk the perimeter of a near-square grid clockwise
 * from the top-left (index 0 = the slipway). 16 spaces → a 5×5 ring.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { QuestSpaceVM } from '@/state/presenters/quest.engine';
import { AXM, FONTS } from '@/theme/axm';

/** Grid cells (col,row) walking the w×h perimeter clockwise from (0,0). */
export function perimeterCells(w: number, h: number): { col: number; row: number }[] {
    const cells: { col: number; row: number }[] = [];
    for (let col = 0; col < w; col++) cells.push({ col, row: 0 });
    for (let row = 1; row < h - 1; row++) cells.push({ col: w - 1, row });
    for (let col = w - 1; col >= 0; col--) cells.push({ col, row: h - 1 });
    for (let row = h - 2; row >= 1; row--) cells.push({ col: 0, row });
    return cells;
}

/** Smallest near-square ring that seats `count` spaces. */
export function ringDimensions(count: number): { w: number; h: number } {
    let w = Math.max(3, Math.ceil((count + 4) / 4));
    let h = w;
    while (2 * (w + h) - 4 < count) w += 1;
    return { w, h };
}

const KIND_ACCENTS: Record<string, string> = {
    slipway: AXM.sulfur,
    gather: AXM.bone,
    duel: AXM.blood,
    snag: AXM.rust,
    hearth: AXM.heal,
    market: AXM.parchment,
    parley: AXM.parchment,
    cache: AXM.sulfur,
    omen: AXM.sulfur,
};

export interface QuestBoardTrackProps {
    spaces: readonly QuestSpaceVM[];
    /** Width available; the track renders a square of this size. */
    size: number;
    /** Rendered inside the center well. */
    children?: React.ReactNode;
}

export function QuestBoardTrack({ spaces, size, children }: QuestBoardTrackProps) {
    const { w, h } = ringDimensions(spaces.length);
    const cells = perimeterCells(w, h).slice(0, spaces.length);
    const cell = Math.floor(size / Math.max(w, h));
    const pad = 2;

    return (
        <View style={{ width: cell * w, height: cell * h, alignSelf: 'center' }} testID="quest-board-track">
            {/* Center well */}
            <View
                style={[
                    styles.well,
                    {
                        left: cell + pad,
                        top: cell + pad,
                        width: cell * (w - 2) - pad * 2,
                        height: cell * (h - 2) - pad * 2,
                    },
                ]}
            >
                {children}
            </View>
            {spaces.map((space, i) => {
                const at = cells[i];
                const accent = KIND_ACCENTS[space.kind] ?? AXM.bone;
                return (
                    <View
                        key={space.id}
                        accessibilityLabel={`${space.name}${space.isPiece ? ', the piece stands here' : ''}`}
                        style={[
                            styles.space,
                            {
                                left: at.col * cell + pad,
                                top: at.row * cell + pad,
                                width: cell - pad * 2,
                                height: cell - pad * 2,
                                borderColor: space.isPiece ? AXM.sulfur : AXM.ash,
                                backgroundColor: space.isPiece ? AXM.selectFill : AXM.panelBg,
                            },
                        ]}
                        testID={`quest-space-${space.index}`}
                    >
                        <Text style={[styles.glyph, { color: accent }]}>{space.glyph}</Text>
                        {space.isPiece && (
                            <Text style={styles.piece} testID="quest-piece">
                                ◆
                            </Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    space: {
        position: 'absolute',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glyph: {
        fontSize: 16,
        lineHeight: 20,
    },
    piece: {
        position: 'absolute',
        bottom: 1,
        right: 3,
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.sulfur,
    },
    well: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
    },
});

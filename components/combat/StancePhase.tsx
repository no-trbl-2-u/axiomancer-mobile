import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { StanceOption, StanceKey } from '@/state/presenters/combat.engine';
import { StanceCard } from './StanceCard';

export interface StancePhaseProps {
    options: readonly StanceOption[];
    selected: StanceKey | null;
    onPick: (s: StanceKey) => void;
    a11yLabels: { stanceHeart: string; stanceBody: string; stanceMind: string };
}

export function StancePhase({
    options,
    selected,
    onPick,
    a11yLabels,
}: StancePhaseProps) {
    return (
        <View style={styles.row}>
            {options.map((opt) => (
                <StanceCard
                    key={opt.key}
                    opt={opt}
                    isSel={selected === opt.key}
                    onPick={onPick}
                    a11yLabel={
                        opt.key === 'heart' ? a11yLabels.stanceHeart :
                        opt.key === 'body' ? a11yLabels.stanceBody :
                        a11yLabels.stanceMind
                    }
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 8,
    },
});
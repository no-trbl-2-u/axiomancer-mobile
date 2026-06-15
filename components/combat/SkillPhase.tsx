import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles } from '@/theme/runtime';
import type { SkillOption } from '@/state/presenters/combat.engine';
import { SkillRow } from './SkillRow';

export interface SkillPhaseProps {
    skills: readonly SkillOption[];
    availableCount: number;
    totalCount: number;
    onPick: (s: SkillOption) => void;
}

export const SkillPhase = React.memo(function SkillPhase({
    skills,
    availableCount,
    totalCount,
    onPick,
}: SkillPhaseProps) {
    const styles = useStyles();
    // Skills bound to another stance stay hidden (the stance choice is
    // committed by this phase); skills of the current stance all show,
    // with unaffordable ones greyed out so the player can see what
    // their next tokens would buy.
    const visible = useMemo(
        () => skills.filter((s) => s.disabledReason !== 'wrong-stance'),
        [skills],
    );
    return (
        <View style={styles.list}>
            {visible.map((s) => (
                <SkillRow key={s.id} skill={s} onPick={onPick} />
            ))}
            {visible.length === 0 && (
                <Text style={styles.emptyHint}>none open · stance bound.</Text>
            )}
            <Text style={styles.availHint}>
                {availableCount} of {totalCount} open · stance bound.
            </Text>
        </View>
    );
});

const useStyles = makeStyles((AXM) => ({
    list: {
        paddingHorizontal: 8,
    },
    emptyHint: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.ash,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingVertical: 16,
    },
    availHint: {
        fontFamily: FONTS.serif,
        fontSize: 10,
        color: AXM.ash,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
    },
}));
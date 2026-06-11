import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { ActionIcon } from '@/components/ActionIcon';
import { SectionLabel } from '@/components/SectionLabel';

interface EventBadgeProps {
    eventCallout: {
        iconKey: string;
        title: string;
    };
}

export function EventBadge({ eventCallout }: EventBadgeProps) {
    return (
        <View style={styles.eventCallout}>
            <View style={styles.eventCalloutRow}>
                <ActionIcon kind={eventCallout.iconKey} size={20} color={AXM.blood} />
                <SectionLabel size={9} color={AXM.blood}>NEW EVENT</SectionLabel>
            </View>
            <Text style={styles.eventCalloutText}>{eventCallout.title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    eventCallout: {
        position: 'absolute',
        top: 50,
        right: 12,
        width: 130,
        backgroundColor: AXM.bg,
        borderWidth: 1,
        borderColor: AXM.blood,
        padding: 8,
        zIndex: 4,
    },
    eventCalloutRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    eventCalloutText: {
        fontFamily: FONTS.gothic,
        fontSize: 13,
        color: AXM.parchment,
        marginTop: 2,
        lineHeight: 15,
    },
});
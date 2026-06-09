/**
 * MercyChoiceModal — Phase 103 befriend mercy choice
 *
 * Presents the engine-emitted post-Befriend choice as a mobile modal:
 * spare/befriend/preserve or exploit the opening for a free guaranteed
 * critical attack. Mobile does not decide eligibility locally — the
 * engine emits mercy choice state when appropriate.
 *
 * Per ADR-0007: exploit option must not read like a neutral attack
 * button. It is temptation with consequence.
 */

import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AXM, FONTS } from '@/theme/axm';
import type { MercyChoiceSlice } from '@/state/presenters/combat.engine';

export interface MercyChoiceModalProps {
    /** VM slice from combat presenter. */
    mercyChoice: MercyChoiceSlice;
    /** Called when player chooses spare/befriend path. */
    onSpare: () => void;
    /** Called when player chooses exploit/critical path. */
    onExploit: () => void;
}

export function MercyChoiceModal({
    mercyChoice,
    onSpare,
    onExploit,
}: MercyChoiceModalProps) {
    const [focusedButton, setFocusedButton] = useState<'spare' | 'exploit' | null>(null);

    // Focus management: when modal opens, set initial focus state to spare button as the default choice
    useEffect(() => {
        if (mercyChoice.isActive) {
            // Use a slight delay to ensure modal animation completes
            const timer = setTimeout(() => {
                setFocusedButton('spare');
            }, 300);
            return () => clearTimeout(timer);
        } else {
            setFocusedButton(null);
        }
    }, [mercyChoice.isActive]);

    if (!mercyChoice.isActive) {
        return null;
    }

    return (
        <Modal
            visible={mercyChoice.isActive}
            transparent
            animationType="fade"
            // Hardware back press is intentionally a no-op — the player
            // must explicitly choose one of the two paths. No dismissal.
            onRequestClose={() => undefined}
            testID="mercy-choice-modal"
        >
            {/* Full-screen backdrop */}
            <View style={styles.backdrop} />
            
            {/* Modal panel */}
            <View style={styles.panelWrap} pointerEvents="box-none">
                <View style={styles.panel}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.heartGlyph} />
                        <Text style={styles.eyebrow}>MERCY OPENS</Text>
                        <View style={styles.separator} />
                        <Text style={styles.contextLabel}>{mercyChoice.enemyName}</Text>
                    </View>
                    
                    {/* Flavor text */}
                    <Text style={styles.flavorText}>
                        The heart&apos;s work is done. Now choose the consequence.
                    </Text>
                    
                    {/* Choice buttons */}
                    <View style={styles.choices}>
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={mercyChoice.a11y.spare}
                            onPress={onSpare}
                            onFocus={() => setFocusedButton('spare')}
                            onBlur={() => setFocusedButton(null)}
                            style={[
                                styles.choiceButton, 
                                styles.spareButton,
                                focusedButton === 'spare' && styles.focusedButton
                            ]}
                            testID="mercy-choice-spare"
                        >
                            <Text style={[styles.choiceLabel, styles.spareLabel]}>
                                {mercyChoice.spareLabel}
                            </Text>
                            <Text style={styles.choiceHint}>
                                {mercyChoice.spareHint}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel={mercyChoice.a11y.exploit}
                            onPress={onExploit}
                            onFocus={() => setFocusedButton('exploit')}
                            onBlur={() => setFocusedButton(null)}
                            style={[
                                styles.choiceButton, 
                                styles.exploitButton,
                                focusedButton === 'exploit' && styles.focusedButton
                            ]}
                            testID="mercy-choice-exploit"
                        >
                            <Text style={[styles.choiceLabel, styles.exploitLabel]}>
                                {mercyChoice.exploitLabel}
                            </Text>
                            <Text style={[styles.choiceHint, styles.exploitHint]}>
                                {mercyChoice.exploitHint}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: AXM.overlay,
    },
    panelWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    panel: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: AXM.bg,
        borderWidth: 2,
        borderColor: AXM.sulfur,
        shadowColor: AXM.sulfur,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        backgroundColor: AXM.deepBg,
    },
    heartGlyph: {
        width: 12,
        height: 12,
        backgroundColor: AXM.sulfur,
        borderRadius: 6,
        marginRight: 8,
    },
    eyebrow: {
        fontFamily: FONTS.gothic,
        fontSize: 11,
        color: AXM.sulfur,
        letterSpacing: 1,
    },
    separator: {
        flex: 1,
    },
    contextLabel: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.bone,
    },
    flavorText: {
        padding: 20,
        fontFamily: FONTS.serif,
        fontSize: 15,
        color: AXM.parchment,
        lineHeight: 22,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    choices: {
        padding: 16,
        gap: 12,
    },
    choiceButton: {
        padding: 16,
        borderWidth: 2,
        borderRadius: 0,
        minHeight: 72,
    },
    spareButton: {
        backgroundColor: AXM.deepBg,
        borderColor: AXM.sulfur,
    },
    exploitButton: {
        backgroundColor: AXM.rustSubtle,
        borderColor: AXM.blood,
    },
    choiceLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 16,
        letterSpacing: 2,
        textAlign: 'center',
        marginBottom: 4,
    },
    spareLabel: {
        color: AXM.sulfur,
    },
    exploitLabel: {
        color: AXM.blood,
    },
    choiceHint: {
        fontFamily: FONTS.serif,
        fontSize: 12,
        color: AXM.bone,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    exploitHint: {
        color: AXM.rust, // Darker warning tone
    },
    focusedButton: {
        shadowColor: AXM.sulfur,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
        borderWidth: 3,
    },
});
/**
 * SkillConfirmOverlay — Phase 127 deterministic skill confirmation.
 *
 * Tapping a skill in the picker no longer commits the round outright.
 * It opens this overlay first: a legible detail card of the chosen
 * technique — name, stance, cost, affordability, and the deterministic
 * damage / effects / statuses (the engine-owned `effectText`) plus the
 * skill's prose — with two explicit controls:
 *
 *   - CONFIRM — commits the skill through the existing engine-backed
 *               action path (`setPlayerAction('skill', id)` + resolve).
 *   - CANCEL  — closes the overlay with no side effects; the player
 *               stays on the skill picker and may choose again.
 *
 * The overlay decides nothing about hit chance or damage: skills are
 * deterministic doctrine, so there is no dice imagery here. It reads
 * the presenter's `SkillOption` projection and reports the player's
 * choice back through callbacks (thin-client law — no local sim).
 */

import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FONTS } from '@/theme/axm';
import { makeStyles, usePalette } from '@/theme/runtime';
import { StanceGlyph } from '@/components/StanceGlyph';
import type { SkillOption } from '@/state/presenters/combat.engine';

export interface SkillConfirmOverlayProps {
    /** The skill awaiting confirmation; `null` keeps the overlay closed. */
    skill: SkillOption | null;
    /** Commit the pending skill. */
    onConfirm: () => void;
    /** Dismiss without committing — returns to the skill picker. */
    onCancel: () => void;
}

export function SkillConfirmOverlay({ skill, onConfirm, onCancel }: SkillConfirmOverlayProps) {
    const styles = useStyles();
    const AXM = usePalette();

    if (skill === null) {
        return null;
    }

    const affordable = skill.enabled;

    return (
        <Modal
            visible={skill !== null}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
            testID="skill-confirm-overlay"
        >
            <View style={styles.backdrop} />
            <View style={styles.panelWrap} pointerEvents="box-none">
                <View style={styles.panel}>
                    {/* Header — technique name + stance glyph */}
                    <View style={styles.header}>
                        <StanceGlyph kind={skill.stance} size={22} color={AXM.sulfur} />
                        <Text style={styles.eyebrow}>CONFIRM TECHNIQUE</Text>
                        <View style={styles.separator} />
                        <Text style={styles.stanceTag}>{skill.stance.toUpperCase()}</Text>
                    </View>

                    <ScrollView contentContainerStyle={styles.body}>
                        <Text style={styles.skillName}>{skill.name}</Text>

                        {/* Deterministic doctrine — engine-owned result line. */}
                        <View style={styles.effectBox}>
                            <Text style={styles.effectLabel}>RESOLVES TO</Text>
                            <Text style={styles.effectText} testID="skill-confirm-effect">
                                {skill.effectText}
                            </Text>
                            <Text style={styles.deterministicNote}>
                                no roll · lands as written.
                            </Text>
                        </View>

                        {/* Cost + affordability. */}
                        <View style={styles.costRow}>
                            <Text style={styles.costLabel}>COST</Text>
                            <Text
                                style={[styles.costValue, !affordable && styles.costShort]}
                                testID="skill-confirm-cost"
                            >
                                {skill.costText}
                            </Text>
                        </View>
                        {!affordable && (
                            <Text style={styles.unaffordableNote} testID="skill-confirm-unaffordable">
                                {skill.disabledReason === 'wrong-stance'
                                    ? 'bound to another stance.'
                                    : 'not enough focus to cast.'}
                            </Text>
                        )}

                        {/* Prose / keywords for the curious. */}
                        {skill.description.length > 0 && (
                            <Text style={styles.description}>{skill.description}</Text>
                        )}
                    </ScrollView>

                    {/* Confirm / Cancel controls */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            onPress={onCancel}
                            accessibilityRole="button"
                            accessibilityLabel="Cancel — choose a different technique"
                            testID="skill-confirm-cancel"
                            style={[styles.btn, styles.cancelBtn]}
                        >
                            <Text style={[styles.btnText, styles.cancelText]}>CANCEL</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (affordable) onConfirm();
                            }}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: !affordable }}
                            accessibilityLabel={`Confirm ${skill.name}, costs ${skill.costText}`}
                            testID="skill-confirm-confirm"
                            style={[
                                styles.btn,
                                styles.confirmBtn,
                                !affordable && styles.confirmDisabled,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.btnText,
                                    styles.confirmText,
                                    !affordable && styles.confirmTextDisabled,
                                ]}
                            >
                                ✠ COMMIT
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const useStyles = makeStyles((AXM) => ({
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
        gap: 8,
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        backgroundColor: AXM.deepBg,
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
    stanceTag: {
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: AXM.bone,
        letterSpacing: 0.5,
    },
    body: {
        padding: 16,
        gap: 12,
    },
    skillName: {
        fontFamily: FONTS.gothic,
        fontSize: 18,
        color: AXM.parchment,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    effectBox: {
        borderWidth: 1,
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
        padding: 12,
    },
    effectLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.ash,
        letterSpacing: 1,
        marginBottom: 4,
    },
    effectText: {
        fontFamily: FONTS.mono,
        fontSize: 12,
        color: AXM.sulfur,
        letterSpacing: 0.5,
        lineHeight: 16,
    },
    deterministicNote: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.bone,
        fontStyle: 'italic',
        marginTop: 6,
    },
    costRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    costLabel: {
        fontFamily: FONTS.sans,
        fontSize: 9,
        color: AXM.ash,
        letterSpacing: 1,
    },
    costValue: {
        fontFamily: FONTS.mono,
        fontSize: 11,
        color: AXM.sulfur,
        fontWeight: '600',
    },
    costShort: {
        color: AXM.blood,
    },
    unaffordableNote: {
        fontFamily: FONTS.serif,
        fontSize: 11,
        color: AXM.blood,
        fontStyle: 'italic',
    },
    description: {
        fontFamily: FONTS.serif,
        fontSize: 12,
        color: AXM.bone,
        lineHeight: 17,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        padding: 14,
        borderTopWidth: 1,
        borderTopColor: AXM.ash,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 2,
    },
    cancelBtn: {
        borderColor: AXM.ash,
        backgroundColor: AXM.deepBg,
    },
    confirmBtn: {
        borderColor: AXM.sulfur,
        backgroundColor: AXM.deepBg,
    },
    confirmDisabled: {
        borderColor: AXM.ash,
    },
    btnText: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        letterSpacing: 1.5,
    },
    cancelText: {
        color: AXM.bone,
    },
    confirmText: {
        color: AXM.sulfur,
    },
    confirmTextDisabled: {
        color: AXM.ash,
    },
}));

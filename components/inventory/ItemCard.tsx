import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { AXM, FONTS } from '@/theme/axm';
import { ActionIcon } from '@/components/ActionIcon';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import type { InventoryCategory, InventoryItemRow } from '@/state/presenters/inventory.engine';

export const CATEGORY_ORDER: readonly InventoryCategory[] = [
    'equipment',
    'consumable',
    'material',
    'quest',
] as const;

export function groupByCategory(items: readonly InventoryItemRow[]): Record<InventoryCategory, InventoryItemRow[]> {
    const out: Record<InventoryCategory, InventoryItemRow[]> = {
        equipment: [],
        consumable: [],
        material: [],
        quest: [],
    };
    for (const it of items) out[it.category].push(it);
    return out;
}

export function ItemGlyph({ category, sub }: { category: InventoryCategory; sub: string | null }) {
    if (category === 'equipment' && sub === 'Weapon') {
        return <ActionIcon kind="sword" size={32} color={AXM.parchment} />;
    }
    if (category === 'equipment' && (sub === 'Armor' || sub === 'Shield')) {
        return <ActionIcon kind="shield" size={32} color={AXM.parchment} />;
    }
    if (category === 'equipment' && sub === 'Accessory') {
        return (
            <Svg 
                width={28} 
                height={28} 
                viewBox="0 0 28 28" 
                fill="none"
                accessibilityRole="image"
                accessibilityLabel="Accessory equipment icon"
            >
                <Circle cx={14} cy={14} r={10} stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
                <Circle cx={14} cy={10} r={3.5} fill={AXM.sulfur} />
                <Path d="M10 18 Q14 22 18 18" stroke={AXM.parchment} strokeWidth={1.2} fill="none" />
            </Svg>
        );
    }
    if (category === 'consumable') {
        return (
            <Svg 
                width={28} 
                height={28} 
                viewBox="0 0 28 28" 
                fill="none"
                accessibilityRole="image"
                accessibilityLabel="Consumable item icon"
            >
                <Path
                    d="M10 24 L10 10 Q10 5 14 4 Q18 5 18 10 L18 24 Z"
                    stroke={AXM.parchment}
                    strokeWidth={1.5}
                    fill="none"
                />
                <Path d="M10 16 L18 16" stroke={AXM.parchment} strokeWidth={1} />
                <Circle cx={14} cy={11} r={2} fill={AXM.blood} />
            </Svg>
        );
    }
    if (category === 'material') {
        return (
            <Svg 
                width={28} 
                height={28} 
                viewBox="0 0 28 28" 
                fill="none"
                accessibilityRole="image"
                accessibilityLabel="Material item icon"
            >
                <Path
                    d="M14 4 L24 10 L24 20 L14 26 L4 20 L4 10 Z"
                    stroke={AXM.parchment}
                    strokeWidth={1.5}
                    fill="none"
                />
                <Path d="M14 4 L14 26 M4 10 L24 20 M24 10 L4 20" stroke={AXM.parchment} strokeWidth={0.7} />
            </Svg>
        );
    }
    if (category === 'quest') {
        return (
            <Svg 
                width={28} 
                height={28} 
                viewBox="0 0 28 28" 
                fill="none"
                accessibilityRole="image"
                accessibilityLabel="Quest item icon"
            >
                <Path
                    d="M6 22 L6 6 L22 6 L22 22 Z"
                    stroke={AXM.parchment}
                    strokeWidth={1.5}
                    fill="none"
                />
                <Path d="M10 10 L18 10 M10 14 L18 14 M10 18 L15 18" stroke={AXM.parchment} strokeWidth={1} />
                <Path d="M20 4 L24 4 L24 8" stroke={AXM.sulfur} strokeWidth={1.5} />
            </Svg>
        );
    }
    return (
        <Svg 
            width={28} 
            height={28} 
            viewBox="0 0 28 28" 
            fill="none"
            accessibilityRole="image"
            accessibilityLabel="Unknown item type icon"
        >
            <Circle cx={14} cy={14} r={10} stroke={AXM.bone} strokeWidth={1} strokeDasharray="3,2" fill="none" />
            <Path d="M11 11 L17 17 M17 11 L11 17" stroke={AXM.bone} strokeWidth={1} />
        </Svg>
    );
}

export interface ItemCardProps {
    item: InventoryItemRow;
    expanded: boolean;
    onTap: () => void;
    onUseOrEquip: () => void;
    onDiscard: () => void;
}

export function ItemCard({ item, expanded, onTap, onUseOrEquip, onDiscard }: ItemCardProps) {
    const itemLabel = item.equipped
        ? `${item.name}, worn`
        : item.quantity > 1
            ? `${item.name}, ${item.quantity}`
            : item.name;
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={itemLabel}
            accessibilityState={{ expanded }}
            onPress={onTap}
            style={[
                styles.itemCard,
                expanded && styles.itemCardExpanded,
                {
                    borderColor: item.equipped ? AXM.sulfur : AXM.ash,
                    borderWidth: item.equipped ? 2 : 1,
                },
            ]}
            testID={`item-${item.id}`}
        >
            <View style={styles.itemIcon}>
                <ItemGlyph category={item.category} sub={item.sub} />
            </View>
            <Text style={styles.itemName} numberOfLines={expanded ? undefined : 2}>
                {item.name}
            </Text>
            {item.category === 'equipment' && !expanded && item.sub !== null && (
                <Text style={styles.itemSlotTag} testID={`slot-tag-${item.id}`}>
                    SLOT {'·'} {item.sub.toUpperCase()}
                </Text>
            )}
            {item.quantity > 1 && (
                <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>{'×'}{item.quantity}</Text>
                </View>
            )}
            {item.equipped && (
                <View style={styles.wornBadge}>
                    <Text style={styles.wornText}>WORN</Text>
                </View>
            )}
            {expanded && (
                <View style={styles.expandedContent}>
                    <Text style={styles.itemDesc}>{'"'}{item.description}{'"'}</Text>
                    {item.replacePreview !== null && (
                        <View style={styles.replacePreview} testID={`replace-preview-${item.id}`}>
                            <Text style={styles.replacePreviewEyebrow}>REPLACES</Text>
                            <View style={styles.replacePreviewNameRow}>
                                <Text style={styles.replacePreviewOldName} numberOfLines={1}>
                                    {item.replacePreview.replacing.name}
                                </Text>
                                <Text style={styles.replacePreviewArrow}>{'→'}</Text>
                                <Text style={styles.replacePreviewNewName} numberOfLines={1}>
                                    {item.name}
                                </Text>
                            </View>
                            {item.replacePreview.deltas.length > 0 && (
                                <View style={styles.replacePreviewDeltas}>
                                    <Text style={styles.replacePreviewLabel}>NET</Text>
                                    {item.replacePreview.deltas.map((d) => {
                                        const positive = d.delta > 0;
                                        return (
                                            <TooltipTarget
                                                key={d.stat}
                                                kind="item-stat"
                                                id={d.stat}
                                                accessibilityLabel={`Explain ${d.stat}`}
                                                accessibilityHint="tap to read description"
                                                testID={`inventory-delta-${d.stat}`}
                                            >
                                                <View
                                                    style={[
                                                        styles.replaceDeltaChip,
                                                        positive ? styles.replaceDeltaChipPos : styles.replaceDeltaChipNeg,
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.replaceDeltaChipText,
                                                            positive ? styles.replaceDeltaChipTextPos : styles.replaceDeltaChipTextNeg,
                                                        ]}
                                                    >
                                                        {positive ? '+' : ''}{d.delta} {d.stat}
                                                    </Text>
                                                </View>
                                            </TooltipTarget>
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}
                    <View style={styles.actionsRow}>
                        {item.canUse && (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={item.category === 'equipment' ? `Equip ${item.name}` : `Use ${item.name}`}
                                style={styles.actionBtn}
                                onPress={onUseOrEquip}
                                testID={`use-${item.id}`}
                            >
                                <Text style={styles.actionBtnText}>
                                    {item.category === 'equipment' ? 'EQUIP' : 'USE'}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {item.canDiscard && (
                            <TouchableOpacity
                                accessibilityRole="button"
                                accessibilityLabel={`Discard ${item.name}`}
                                style={[styles.actionBtn, styles.discardBtn]}
                                onPress={onDiscard}
                                testID={`discard-${item.id}`}
                            >
                                <Text style={[styles.actionBtnText, { color: AXM.blood }]}>DISCARD</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    itemCard: {
        width: '31.5%',
        backgroundColor: AXM.panelBg,
        padding: 6,
        minHeight: 92,
        position: 'relative',
    },
    itemCardExpanded: { width: '100%' },
    itemIcon: {
        width: '100%',
        height: 50,
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: { fontFamily: FONTS.gothic, fontSize: 11, color: AXM.parchment, lineHeight: 14, marginTop: 4 },
    qtyBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: AXM.parchment, paddingHorizontal: 4 },
    qtyText: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bg },
    wornBadge: { position: 'absolute', top: 2, left: 2, backgroundColor: AXM.sulfur, paddingHorizontal: 3 },
    wornText: { fontFamily: FONTS.sans, fontSize: 7, letterSpacing: 1, color: AXM.bg },
    expandedContent: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed' },
    itemDesc: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone },
    actionsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
    actionBtn: {
        flex: 1,
        paddingVertical: 5,
        paddingHorizontal: 6,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: AXM.parchment,
        alignItems: 'center',
    },
    discardBtn: { borderColor: AXM.blood },
    actionBtnText: { fontFamily: FONTS.gothic, fontSize: 11, letterSpacing: 1.5, color: AXM.parchment },
    itemSlotTag: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: AXM.bone,
        letterSpacing: 1.2,
        marginTop: 1,
    },
    replacePreview: {
        marginTop: 6,
        padding: 6,
        paddingHorizontal: 8,
        borderLeftWidth: 2,
        borderLeftColor: AXM.blood,
        backgroundColor: 'rgba(192, 21, 42, 0.06)',
    },
    replacePreviewEyebrow: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1.4,
        marginBottom: 4,
    },
    replacePreviewNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    replacePreviewOldName: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.bone,
        textDecorationLine: 'line-through',
        flexShrink: 1,
    },
    replacePreviewArrow: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.sulfur,
    },
    replacePreviewNewName: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.parchment,
        flexShrink: 1,
    },
    replacePreviewDeltas: {
        marginTop: 6,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        alignItems: 'center',
    },
    replacePreviewLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: AXM.bone,
        letterSpacing: 1.4,
        marginRight: 2,
    },
    replaceDeltaChip: {
        paddingVertical: 1,
        paddingHorizontal: 4,
        borderWidth: 1,
    },
    replaceDeltaChipPos: {
        backgroundColor: 'rgba(212, 192, 38, 0.12)',
        borderColor: AXM.sulfur,
    },
    replaceDeltaChipNeg: {
        backgroundColor: 'rgba(192, 21, 42, 0.14)',
        borderColor: AXM.blood,
    },
    replaceDeltaChipText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 0.8,
    },
    replaceDeltaChipTextPos: {
        color: AXM.sulfur,
    },
    replaceDeltaChipTextNeg: {
        color: AXM.blood,
    },
});

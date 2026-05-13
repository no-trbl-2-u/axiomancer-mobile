import React, { useCallback, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { ActionIcon } from '@/components/ActionIcon';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    selectInventoryViewModel,
    type InventoryCategory,
    type InventoryItemRow,
    type InventoryTab,
} from '@/state/presenters/inventory.engine';
import {
    selectItemModalViewModel,
    type ItemModalViewModel,
} from '@/state/presenters/inventory.modal.engine';

const CATEGORY_ORDER: readonly InventoryCategory[] = [
    'equipment',
    'consumable',
    'material',
    'quest',
] as const;

const CATEGORY_HEADERS: Record<InventoryCategory, string> = {
    equipment: '✠ WORN & WIELDED',
    consumable: '✠ PHIALS & SOPS',
    material: '✠ STUFF',
    quest: '✠ SEALED',
};

function ItemGlyph({ category, sub }: { category: InventoryCategory; sub: string | null }) {
    if (category === 'equipment' && sub === 'Weapon') {
        return <ActionIcon kind="sword" size={32} color={AXM.parchment} />;
    }
    if (category === 'equipment' && sub === 'Armor') {
        return <ActionIcon kind="shield" size={32} color={AXM.parchment} />;
    }
    if (category === 'equipment') {
        return (
            <Svg viewBox="0 0 32 32" width={32} height={32} fill="none" stroke={AXM.parchment} strokeWidth={2}>
                <Path d="M6 8 L 26 8 L 22 26 L 10 26 Z" />
            </Svg>
        );
    }
    if (category === 'consumable') {
        return (
            <Svg viewBox="0 0 32 32" width={32} height={32} fill="none" stroke={AXM.parchment} strokeWidth={2}>
                <Path
                    d="M12 4 H 20 V 12 L 24 24 C 24 27 22 28 16 28 C 10 28 8 27 8 24 L 12 12 Z"
                    fill={AXM.parchment}
                    fillOpacity={0.2}
                />
                <Path d="M12 4 H 20" strokeWidth={3} />
            </Svg>
        );
    }
    if (category === 'material') {
        return (
            <Svg viewBox="0 0 32 32" width={32} height={32} fill={AXM.parchment}>
                <Circle cx={10} cy={14} r={3} />
                <Circle cx={20} cy={10} r={2.5} />
                <Circle cx={22} cy={20} r={3.5} />
                <Circle cx={12} cy={22} r={2} />
                <Circle cx={16} cy={16} r={2} />
            </Svg>
        );
    }
    return <ActionIcon kind="scroll" size={32} color={AXM.sulfur} />;
}

function EmptySack() {
    return (
        <View style={styles.emptyOuter} testID="inventory-empty">
            <Svg viewBox="0 0 64 64" width={64} height={64} fill="none" stroke={AXM.bone} strokeWidth={2}>
                <Path d="M14 18 L 50 18 L 54 56 H 10 Z" fill={AXM.bg} fillOpacity={0.6} />
                <Path d="M22 18 V 12 A 10 10 0 0 1 42 12 V 18" />
                <Path d="M22 30 Q 32 22 42 30" strokeLinecap="round" />
            </Svg>
            <Text style={styles.emptyText}>Thy sack is empty.</Text>
        </View>
    );
}

export default function InventoryScreen() {
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [modalItemId, setModalItemId] = useState<string | null>(null);

    // Subscribe to `player` so the screen re-renders on inventory changes.
    // The selector pattern (`useGameState(s => selectVM(s, localUi))`) breaks
    // referential equality because `freezeViewModel` returns a fresh object
    // each call; rebuilding the VM in `useMemo` keyed by `player` avoids the
    // resulting re-render loop.
    const player = useGameState((s) => s.player);
    const store = useGameStore();
    const actions = useGameActions();

    const vm = useMemo(
        () => selectInventoryViewModel(store.getState(), { activeTab, expandedItemId }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store, activeTab, expandedItemId, player],
    );

    const modalVm = useMemo<ItemModalViewModel | null>(() => {
        if (modalItemId === null) return null;
        return selectItemModalViewModel(store.getState(), modalItemId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modalItemId, store, player]);

    const onConfirmModal = useCallback(() => {
        if (modalVm === null || modalVm.itemId === null) {
            setModalItemId(null);
            return;
        }
        if (modalVm.mode === 'use') {
            actions.useItem(modalVm.itemId);
        } else if (modalVm.mode === 'equip') {
            actions.equipItem(modalVm.itemId);
        }
        setModalItemId(null);
        setExpandedItemId(null);
    }, [actions, modalVm]);

    const onDiscard = useCallback(
        (itemId: string) => {
            actions.dropItem(itemId);
            setExpandedItemId(null);
        },
        [actions],
    );

    const grouped = useMemo(() => groupByCategory(vm.items), [vm.items]);

    return (
        <ScreenBg>
            <View style={styles.header}>
                <SectionLabel size={9} color={AXM.bone}>SACK · WALLET · BURDEN</SectionLabel>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>INVENTORY</Text>
                    <View style={styles.shillingBox}>
                        <Text style={styles.shillingLabel}>SHILLING</Text>
                        <Text style={styles.shillingVal}>⚜ {vm.shilling}</Text>
                    </View>
                </View>
                <View style={{ marginTop: 8 }}>
                    <StatBar value={vm.burden} max={vm.burdenMax} color={AXM.rust} label="BURDEN · STONE" height={9} />
                </View>
            </View>

            <View style={styles.tabRow}>
                {vm.tabs.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        onPress={() => setActiveTab(t.key)}
                        style={[styles.tab, activeTab === t.key && styles.tabActive]}
                        testID={`tab-${t.key}`}
                    >
                        <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                            {t.label}
                        </Text>
                        {t.count > 0 && (
                            <Text style={[styles.tabCount, activeTab === t.key && styles.tabCountActive]}>
                                {t.count}
                            </Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            {vm.isEmpty ? (
                <EmptySack />
            ) : (
                <View style={styles.gridOuter}>
                    {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
                        <View key={cat} style={styles.categorySection}>
                            <SectionLabel size={10}>{CATEGORY_HEADERS[cat]}</SectionLabel>
                            <View style={styles.grid}>
                                {grouped[cat].map((it) => (
                                    <ItemCard
                                        key={it.id}
                                        item={it}
                                        expanded={expandedItemId === it.id}
                                        onTap={() =>
                                            setExpandedItemId(expandedItemId === it.id ? null : it.id)
                                        }
                                        onUseOrEquip={() => setModalItemId(it.id)}
                                        onDiscard={() => onDiscard(it.id)}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <Modal
                visible={modalVm !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setModalItemId(null)}
            >
                <Pressable style={styles.modalBackdrop} onPress={() => setModalItemId(null)}>
                    <Pressable style={styles.modalCard} onPress={() => undefined}>
                        {modalVm !== null && (
                            <>
                                <Text style={styles.modalTitle}>{modalVm.name}</Text>
                                <Text style={styles.modalDesc}>&ldquo;{modalVm.description}&rdquo;</Text>
                                {modalVm.previewLines.length > 0 && (
                                    <View style={styles.modalPreviewBlock}>
                                        {modalVm.previewLines.map((line, i) => (
                                            <Text key={i} style={styles.modalPreview}>{line}</Text>
                                        ))}
                                    </View>
                                )}
                                {modalVm.statDeltas.length > 0 && (
                                    <View style={styles.modalStatTable}>
                                        {modalVm.statDeltas.map((d) => (
                                            <View key={d.label} style={styles.modalStatRow}>
                                                <Text style={styles.modalStatLabel}>{d.label}</Text>
                                                <Text style={styles.modalStatVal}>
                                                    {d.before} → {d.after}
                                                    {d.delta === 0 ? '' : ` (${d.delta > 0 ? '+' : ''}${d.delta})`}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {modalVm.confirmPrompt !== '' && (
                                    <Text style={styles.modalPrompt}>{modalVm.confirmPrompt}</Text>
                                )}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        onPress={() => setModalItemId(null)}
                                        style={[styles.modalBtn, styles.modalBtnCancel]}
                                    >
                                        <Text style={[styles.modalBtnText, { color: AXM.bone }]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={onConfirmModal}
                                        style={styles.modalBtn}
                                        testID="modal-confirm"
                                    >
                                        <Text style={styles.modalBtnText}>{modalVm.confirmLabel}</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </ScreenBg>
    );
}

function groupByCategory(items: readonly InventoryItemRow[]): Record<InventoryCategory, InventoryItemRow[]> {
    const out: Record<InventoryCategory, InventoryItemRow[]> = {
        equipment: [],
        consumable: [],
        material: [],
        quest: [],
    };
    for (const it of items) out[it.category].push(it);
    return out;
}

interface ItemCardProps {
    item: InventoryItemRow;
    expanded: boolean;
    onTap: () => void;
    onUseOrEquip: () => void;
    onDiscard: () => void;
}

function ItemCard({ item, expanded, onTap, onUseOrEquip, onDiscard }: ItemCardProps) {
    return (
        <TouchableOpacity
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

            {item.quantity > 1 && (
                <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>×{item.quantity}</Text>
                </View>
            )}
            {item.equipped && (
                <View style={styles.wornBadge}>
                    <Text style={styles.wornText}>WORN</Text>
                </View>
            )}

            {expanded && (
                <View style={styles.expandedContent}>
                    <Text style={styles.itemDesc}>&ldquo;{item.description}&rdquo;</Text>
                    <View style={styles.actionsRow}>
                        {item.canUse && (
                            <TouchableOpacity
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
    header: { padding: 14, paddingBottom: 0 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    title: { fontFamily: FONTS.gothic, fontSize: 28, lineHeight: 30, color: AXM.parchment, marginTop: 2 },
    shillingBox: { alignItems: 'flex-end' },
    shillingLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
    shillingVal: { fontFamily: FONTS.gothic, fontSize: 22, color: AXM.sulfur, lineHeight: 24 },
    tabRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: AXM.ash,
        marginHorizontal: 10,
        marginTop: 12,
        marginBottom: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 6,
        paddingHorizontal: 4,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    tabActive: { backgroundColor: AXM.parchment },
    tabText: { fontFamily: FONTS.gothic, fontSize: 12, letterSpacing: 1, color: AXM.parchment, textAlign: 'center' },
    tabTextActive: { color: '#0a0a0a' },
    tabCount: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    tabCountActive: { color: '#0a0a0a' },
    gridOuter: { paddingHorizontal: 10, paddingBottom: 14 },
    categorySection: { marginTop: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
    itemCard: {
        width: '31.5%',
        backgroundColor: '#100d0a',
        padding: 6,
        minHeight: 92,
        position: 'relative',
    },
    itemCardExpanded: { width: '100%' },
    itemIcon: {
        width: '100%',
        height: 50,
        backgroundColor: '#06050a',
        borderWidth: 1,
        borderColor: AXM.ash,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemName: { fontFamily: FONTS.gothic, fontSize: 11, color: AXM.parchment, lineHeight: 14, marginTop: 4 },
    qtyBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: AXM.parchment, paddingHorizontal: 4 },
    qtyText: { fontFamily: FONTS.mono, fontSize: 10, color: '#0a0a0a' },
    wornBadge: { position: 'absolute', top: 2, left: 2, backgroundColor: AXM.sulfur, paddingHorizontal: 3 },
    wornText: { fontFamily: FONTS.sans, fontSize: 7, letterSpacing: 1, color: '#0a0a0a' },
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
    emptyOuter: {
        marginHorizontal: 14,
        marginTop: 40,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
    },
    emptyText: {
        fontFamily: FONTS.serifItalic,
        fontSize: 14,
        color: AXM.bone,
        marginTop: 14,
        textAlign: 'center',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#100d0a',
        borderWidth: 1,
        borderColor: AXM.parchment,
        padding: 16,
    },
    modalTitle: { fontFamily: FONTS.gothic, fontSize: 20, color: AXM.parchment, letterSpacing: 1 },
    modalDesc: { fontFamily: FONTS.serifItalic, fontSize: 12, color: AXM.bone, marginTop: 4 },
    modalPreviewBlock: { marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed' },
    modalPreview: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment, lineHeight: 16 },
    modalStatTable: {
        marginTop: 8,
        padding: 8,
        backgroundColor: '#06050a',
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    modalStatRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 1 },
    modalStatLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 1, color: AXM.bone },
    modalStatVal: { fontFamily: FONTS.mono, fontSize: 11, color: AXM.parchment },
    modalPrompt: { fontFamily: FONTS.serifItalic, fontSize: 13, color: AXM.parchment, marginTop: 12 },
    modalActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
    modalBtn: {
        flex: 1,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: AXM.parchment,
        alignItems: 'center',
    },
    modalBtnCancel: { borderColor: AXM.bone },
    modalBtnText: { fontFamily: FONTS.gothic, fontSize: 13, letterSpacing: 1.5, color: AXM.parchment },
});

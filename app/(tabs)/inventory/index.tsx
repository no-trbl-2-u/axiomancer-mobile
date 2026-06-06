import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { CATEGORY_ORDER, groupByCategory, ItemCard, ItemGlyph } from '@/components/inventory/ItemCard';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { TooltipProvider } from '@/components/tooltip/TooltipProvider';
import { TooltipTarget } from '@/components/tooltip/TooltipTarget';
import { useTooltip } from '@/hooks/useTooltip';
import { useGameActions, useGameState, useGameStore } from '@/state/GameStoreProvider';
import {
    selectInventoryViewModel,
    type EquipmentDockSlot,
    type EquipmentDockViewModel,
    type InventoryTab,
} from '@/state/presenters/inventory.engine';
import {
    selectItemModalViewModel,
    type ItemModalViewModel,
} from '@/state/presenters/inventory.modal.engine';

function PaperDoll() {
    return (
        <Svg viewBox="0 0 70 180" width={52} height={140} fill="none">
            {/* halo */}
            <Circle cx={35} cy={22} r={20} stroke={AXM.sulfur} strokeWidth={0.6} strokeOpacity={0.4} strokeDasharray="1 2" />
            {/* hood */}
            <Path d="M35 6 C 16 6 12 26 16 46 L 54 46 C 58 26 54 6 35 6 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* face cavity */}
            <Path d="M24 22 L 46 22 L 44 38 L 35 44 L 26 38 Z" fill={AXM.bg} stroke={AXM.ash} strokeWidth={0.6} />
            {/* torso */}
            <Path d="M18 48 L 52 48 L 56 92 L 14 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* arms */}
            <Path d="M14 50 L 6 90 L 12 92 L 18 56 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            <Path d="M56 50 L 64 90 L 58 92 L 52 56 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* hands */}
            <Circle cx={9} cy={94} r={4} fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            <Circle cx={61} cy={94} r={4} fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            {/* legs */}
            <Path d="M18 92 L 14 158 L 26 158 L 30 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            <Path d="M40 92 L 44 158 L 56 158 L 52 92 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1.2} />
            {/* feet */}
            <Path d="M12 158 L 12 168 L 28 168 L 28 158 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
            <Path d="M42 158 L 42 168 L 58 168 L 58 158 Z" fill={AXM.silhouette} stroke={AXM.parchment} strokeWidth={1} />
        </Svg>
    );
}

/** Pair the flat slot list into 4 rows of {left, right} per the design grid. */
function pairDockRows(
    slots: readonly EquipmentDockSlot[],
): readonly (readonly [EquipmentDockSlot, EquipmentDockSlot | null])[] {
    // Design order: head, body / weapon, armor / hands, accessory / feet, —.
    // Presenter ships the 7 slots in that order (state/presenters/inventory.engine.ts
    // `DOCK_SLOT_ORDER`). Pair index 0..1, 2..3, 4..5, and trailing 6 alone.
    return [
        [slots[0], slots[1]] as const,
        [slots[2], slots[3]] as const,
        [slots[4], slots[5]] as const,
        [slots[6], null] as const,
    ];
}

function SlotCard({
    slot,
    bareLabel,
    selected,
    onPress,
}: {
    slot: EquipmentDockSlot | null;
    bareLabel: string;
    selected: boolean;
    onPress: (key: EquipmentDockSlot['key'] | null) => void;
}) {
    // Phase 74 follow-up walkthrough Tick 1: long-press fires the
    // kind:'slot' tooltip (content shared with the SELF surface).
    // Single-tap stays for slot-filter select (existing behaviour),
    // mirroring Phase 75 skill-row pattern.
    const tooltip = useTooltip();
    const slotRef = useRef<View | null>(null);
    if (slot === null) {
        return <View style={styles.dockSlotEmpty} />;
    }
    const filled = slot.item !== null;
    return (
        <TouchableOpacity
            ref={slotRef}
            accessibilityRole="button"
            accessibilityLabel={`${slot.label} slot${filled && slot.item ? `, ${slot.item.name}` : ', empty'}`}
            accessibilityHint="hold to read slot description"
            accessibilityState={{ selected }}
            onPress={() => onPress(selected ? null : slot.key)}
            onLongPress={() => tooltip.show({ kind: 'slot', id: slot.key, anchorRef: slotRef })}
            style={[
                styles.dockSlot,
                filled ? styles.dockSlotFilled : styles.dockSlotBare,
                selected && styles.dockSlotSelected,
            ]}
            testID={`dock-slot-${slot.key}`}
        >
            <View style={[styles.dockSlotGlyph, filled ? styles.dockSlotGlyphFilled : styles.dockSlotGlyphBare]}>
                {filled && slot.item !== null ? (
                    <ItemGlyph category="equipment" sub={slot.item.sub} />
                ) : (
                    <Text style={styles.dockSlotEmptyMark}>∅</Text>
                )}
            </View>
            <View style={styles.dockSlotText}>
                <Text style={styles.dockSlotLabel}>{slot.label}</Text>
                <Text
                    numberOfLines={1}
                    style={filled ? styles.dockSlotItemName : styles.dockSlotItemBare}
                >
                    {filled && slot.item !== null ? slot.item.name : bareLabel}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

function EquipmentDock({
    vm,
    selectedSlot,
    onSelectSlot,
}: {
    vm: EquipmentDockViewModel;
    selectedSlot: EquipmentDockSlot['key'] | null;
    onSelectSlot: (key: EquipmentDockSlot['key'] | null) => void;
}) {
    const rows = useMemo(() => pairDockRows(vm.slots), [vm.slots]);
    return (
        <View style={styles.dock} testID="equipment-dock">
            {/* iron rivets in each corner */}
            {[
                [4, 4],
                [undefined, 4],
                [4, undefined],
                [undefined, undefined],
            ].map(([left, top], i) => (
                <View
                    key={i}
                    style={[
                        styles.dockRivet,
                        left !== undefined ? { left } : { right: 4 },
                        top !== undefined ? { top } : { bottom: 4 },
                    ]}
                />
            ))}
            <View style={styles.dockHeaderRow}>
                <SectionLabel size={9} color={AXM.bone}>{vm.headerLabel}</SectionLabel>
                <Text style={styles.dockHint}>{vm.hintLabel}</Text>
            </View>
            <View style={styles.dockGrid}>
                <View style={styles.dockCol}>
                    {rows.map(([L], r) => (
                        <SlotCard
                            key={r}
                            slot={L}
                            bareLabel={vm.bareLabel}
                            selected={L !== null && selectedSlot === L.key}
                            onPress={onSelectSlot}
                        />
                    ))}
                </View>
                <View style={styles.dockSilhouette}>
                    <PaperDoll />
                </View>
                <View style={styles.dockCol}>
                    {rows.map(([, R], r) => (
                        <SlotCard
                            key={r}
                            slot={R}
                            bareLabel={vm.bareLabel}
                            selected={R !== null && selectedSlot === R.key}
                            onPress={onSelectSlot}
                        />
                    ))}
                </View>
            </View>
        </View>
    );
}

function EmptySack({ message }: { message: string }) {
    return (
        <View style={styles.emptyOuter} testID="inventory-empty">
            <Svg viewBox="0 0 64 64" width={64} height={64} fill="none" stroke={AXM.bone} strokeWidth={2}>
                <Path d="M14 18 L 50 18 L 54 56 H 10 Z" fill={AXM.bg} fillOpacity={0.6} />
                <Path d="M22 18 V 12 A 10 10 0 0 1 42 12 V 18" />
                <Path d="M22 30 Q 32 22 42 30" strokeLinecap="round" />
            </Svg>
            <Text style={styles.emptyText}>{message}</Text>
        </View>
    );
}

export default function InventoryScreen() {
    const [activeTab, setActiveTab] = useState<InventoryTab>('all');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [modalItemId, setModalItemId] = useState<string | null>(null);
    // Phase 32 sub-tick F follow-up: tap a dock slot to filter the sack
    // to compatible items. selectedSlot === null when no filter active;
    // selecting filter clears the tab pick (mirrors design — slot filter
    // and tab filter are mutually exclusive). Re-tapping the same slot
    // clears the filter.
    const [selectedSlot, setSelectedSlot] = useState<EquipmentDockSlot['key'] | null>(null);
    const onSelectSlot = useCallback((key: EquipmentDockSlot['key'] | null) => {
        setSelectedSlot(key);
        if (key !== null) setActiveTab('all');
    }, []);

    // Subscribe to `player` so the screen re-renders on inventory changes.
    // The selector pattern (`useGameState(s => selectVM(s, localUi))`) breaks
    // referential equality because `freezeViewModel` returns a fresh object
    // each call; rebuilding the VM in `useMemo` keyed by `player` avoids the
    // resulting re-render loop.
    const player = useGameState((s) => s.player);
    const store = useGameStore();
    const actions = useGameActions();

    const vm = useMemo(
        () => selectInventoryViewModel(store.getState(), { activeTab, expandedItemId, selectedSlot }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [store, activeTab, expandedItemId, selectedSlot, player],
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
        } else if (modalVm.mode === 'unequip') {
            // User-jot 2026-05-22 (oversight 29th): unequip is the
            // swap counterpart to equip; mobile "first-per-slot =
            // worn" convention surfaces it as a slot-peer swap.
            actions.unequipItem(modalVm.itemId);
        }
        // mode === 'view' (e.g. WORN sole-item-in-slot) → no
        // dispatch; just dismiss the modal.
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

    // vm.items already accounts for slot-filter vs tab-filter on the
    // presenter side (sub-tick F lifted the inline SLOT_KEY_TO_SUB map
    // onto the presenter as `filterRowsBySlot`). Screen consumes
    // vm.items unconditionally now.
    const grouped = useMemo(() => groupByCategory(vm.items), [vm.items]);

    return (
        <ScreenBg>
            <View style={styles.header}>
                <SectionLabel size={9} color={AXM.bone}>{vm.sectionHeader}</SectionLabel>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>INVENTORY</Text>
                    <View style={styles.shillingBox}>
                        <Text style={styles.shillingLabel}>SHILLING</Text>
                        <Text style={styles.shillingVal}>⚜ {vm.shilling}</Text>
                    </View>
                </View>
                <View style={styles.burdenSection}>
                    {/* Phase 74 follow-up walkthrough — wrap the
                        burden bar in a TooltipTarget pointing at
                        the new kind:'burden' content. Tap explains
                        what burden does + the over-cap consequence. */}
                    <TooltipTarget
                        kind="burden"
                        id="burden"
                        accessibilityLabel="Explain burden"
                        accessibilityHint="tap to read description"
                        testID="inventory-burden-tooltip-target"
                    >
                        <StatBar value={vm.burden} max={vm.burdenMax} color={AXM.rust} label="BURDEN · STONE" height={9} />
                    </TooltipTarget>
                </View>
            </View>

            <EquipmentDock vm={vm.equipmentDock} selectedSlot={selectedSlot} onSelectSlot={onSelectSlot} />

            {vm.equipmentDock.selectedSlot !== null && (
                <View style={styles.slotBanner} testID="slot-filter-banner">
                    <View>
                        <Text style={styles.slotBannerEyebrow}>{vm.equipmentDock.bannerEyebrow}</Text>
                        <Text style={styles.slotBannerLabel}>
                            ✦ {vm.equipmentDock.bannerSlotLabel}
                        </Text>
                    </View>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Clear slot filter"
                        onPress={() => setSelectedSlot(null)}
                        style={styles.slotBannerClear}
                        testID="slot-filter-clear"
                    >
                        <Text style={styles.slotBannerClearText}>{vm.equipmentDock.bannerClearLabel}</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.tabRow, selectedSlot !== null && styles.tabRowDimmed]}>
                {vm.tabs.map((t) => (
                    <TouchableOpacity
                        key={t.key}
                        accessibilityRole="button"
                        accessibilityLabel={`${t.label}${t.count > 0 ? `, ${t.count} ${t.count === 1 ? 'item' : 'items'}` : ''}`}
                        accessibilityState={{ selected: activeTab === t.key }}
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
                <EmptySack message={vm.emptyMessage} />
            ) : (
                <View style={styles.gridOuter}>
                    {CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map((cat) => (
                        <View key={cat} style={styles.categorySection}>
                            <SectionLabel size={10}>{vm.categoryHeaders[cat]}</SectionLabel>
                            <View style={styles.grid}>
                                {grouped[cat].map((it) => (
                                    <ItemCard
                                        key={it.id}
                                        item={it}
                                        expanded={expandedItemId === it.id}
                                        onTap={() => {
                                            // For equipment, go directly to modal instead of expanding
                                            if (it.category === 'equipment' && it.canUse) {
                                                setModalItemId(it.id);
                                            } else {
                                                // For other items, expand to show details first
                                                setExpandedItemId(expandedItemId === it.id ? null : it.id);
                                            }
                                        }}
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
                <TooltipProvider>
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
                                        {modalVm.statDeltas.map((d) => {
                                            const row = (
                                                <View style={styles.modalStatRow}>
                                                    <Text style={styles.modalStatLabel}>{d.label}</Text>
                                                    <Text style={styles.modalStatVal}>
                                                        {d.before} → {d.after}
                                                        {d.delta === 0 ? '' : ` (${d.delta > 0 ? '+' : ''}${d.delta})`}
                                                    </Text>
                                                </View>
                                            );
                                            return d.id !== undefined ? (
                                                <TooltipTarget
                                                    key={d.label}
                                                    kind="item-stat"
                                                    id={d.id}
                                                    testID={`inv-modal-stat-${d.id}`}
                                                >
                                                    {row}
                                                </TooltipTarget>
                                            ) : (
                                                <View key={d.label}>{row}</View>
                                            );
                                        })}
                                    </View>
                                )}
                                {modalVm.confirmPrompt !== '' && (
                                    <Text style={styles.modalPrompt}>{modalVm.confirmPrompt}</Text>
                                )}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Cancel"
                                        onPress={() => setModalItemId(null)}
                                        style={[styles.modalBtn, styles.modalBtnCancel]}
                                    >
                                        <Text style={[styles.modalBtnText, { color: AXM.bone }]}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel={modalVm.confirmLabel}
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
                </TooltipProvider>
            </Modal>
        </ScreenBg>
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
    tabTextActive: { color: AXM.bg },
    tabCount: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
    tabCountActive: { color: AXM.bg },
    gridOuter: { paddingHorizontal: 10, paddingBottom: 14 },
    categorySection: { marginTop: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
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
        backgroundColor: AXM.panelBg,
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
        backgroundColor: AXM.deepBg,
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

    // ── Equipment Dock (Phase 32 tick E port) ──────────────────────────
    dock: {
        marginHorizontal: 10,
        marginTop: 8,
        backgroundColor: AXM.dockBg,
        borderWidth: 1,
        borderColor: AXM.ash,
        padding: 8,
        paddingHorizontal: 10,
        paddingBottom: 10,
        position: 'relative',
    },
    dockRivet: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: AXM.ash,
    },
    dockHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    dockHint: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        color: AXM.bone,
        letterSpacing: 1.4,
    },
    dockGrid: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    dockCol: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    dockSilhouette: {
        width: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dockSlot: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        padding: 3,
        paddingHorizontal: 5,
        height: 34,
    },
    dockSlotEmpty: {
        height: 34,
    },
    dockSlotFilled: {
        backgroundColor: AXM.panelBg,
        borderWidth: 1.5,
        borderColor: AXM.sulfur,
    },
    dockSlotBare: {
        borderWidth: 1.5,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
    },
    dockSlotGlyph: {
        width: 22,
        height: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dockSlotGlyphFilled: {
        backgroundColor: AXM.deepBg,
        borderWidth: 1,
        borderColor: AXM.ash,
    },
    dockSlotGlyphBare: {
        borderWidth: 1,
        borderColor: AXM.ash,
        borderStyle: 'dashed',
    },
    dockSlotEmptyMark: {
        fontFamily: FONTS.gothic,
        fontSize: 12,
        color: AXM.ash,
    },
    dockSlotText: {
        flex: 1,
        minWidth: 0,
    },
    dockSlotLabel: {
        fontFamily: FONTS.mono,
        fontSize: 7,
        letterSpacing: 1.3,
        color: AXM.bone,
        lineHeight: 8,
    },
    dockSlotItemName: {
        fontFamily: FONTS.gothic,
        fontSize: 10.5,
        color: AXM.parchment,
        lineHeight: 12,
        marginTop: 1,
    },
    dockSlotItemBare: {
        fontFamily: FONTS.serifItalic,
        fontSize: 9,
        color: AXM.ash,
        lineHeight: 11,
        marginTop: 1,
    },
    dockSlotSelected: {
        borderWidth: 2,
        borderColor: AXM.sulfur,
        backgroundColor: AXM.selectFill,
    },

    // ── Slot filter banner (Phase 32 sub-tick F-feed port) ──────────────
    slotBanner: {
        marginHorizontal: 10,
        marginTop: 6,
        marginBottom: 6,
        padding: 5,
        paddingHorizontal: 10,
        backgroundColor: AXM.selectFill,
        borderWidth: 1.5,
        borderColor: AXM.sulfur,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    slotBannerEyebrow: {
        fontFamily: FONTS.mono,
        fontSize: 8,
        color: AXM.bone,
        letterSpacing: 1.4,
    },
    slotBannerLabel: {
        fontFamily: FONTS.gothic,
        fontSize: 14,
        color: AXM.sulfur,
        letterSpacing: 1.5,
    },
    slotBannerClear: {
        padding: 3,
        paddingHorizontal: 6,
        borderWidth: 1,
        borderColor: AXM.parchment,
    },
    slotBannerClearText: {
        fontFamily: FONTS.mono,
        fontSize: 9,
        letterSpacing: 1.4,
        color: AXM.parchment,
    },
    tabRowDimmed: {
        opacity: 0.4,
    },
    burdenSection: {
        marginTop: 8,
    },

});

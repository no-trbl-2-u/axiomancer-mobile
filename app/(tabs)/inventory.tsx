import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StatBar } from '@/components/StatBar';
import { ActionIcon } from '@/components/ActionIcon';

type ItemCategory = 'equipment' | 'consumable' | 'material' | 'quest';

interface Item {
  id: number;
  name: string;
  cat: ItemCategory;
  sub?: string;
  qty: number;
  equipped?: boolean;
  desc: string;
}

const ITEMS: Item[] = [
  { id: 1,  name: 'Long Blade',         cat: 'equipment',  sub: 'Weapon', qty: 1, equipped: true,  desc: 'Iron, notched. Drinks blood.' },
  { id: 2,  name: "Saint's Rags",       cat: 'equipment',  sub: 'Body',   qty: 1, equipped: true,  desc: '+2 Heart Defense.' },
  { id: 3,  name: 'Antler Hood',        cat: 'equipment',  sub: 'Head',   qty: 1, equipped: true,  desc: '+1 Mind Skill.' },
  { id: 4,  name: 'Coffin Boots',       cat: 'equipment',  sub: 'Feet',   qty: 1, equipped: true,  desc: 'Silent on stone.' },
  { id: 5,  name: 'Iron Yoke',          cat: 'equipment',  sub: 'Armor',  qty: 1, equipped: true,  desc: '-1 Mind, +3 Body Def.' },
  { id: 10, name: 'Black Bread',        cat: 'consumable',              qty: 4,                   desc: 'Restore 6 HP. Stale.' },
  { id: 11, name: 'Worm Wine',          cat: 'consumable',              qty: 2,                   desc: '+4 Mana, applies POISON 1.' },
  { id: 12, name: 'Stitch Kit',         cat: 'consumable',              qty: 1,                   desc: 'Cure BLEED. Heal 4 HP.' },
  { id: 13, name: 'Blood Censer',       cat: 'consumable',              qty: 1,                   desc: 'Inflict BURN 3 to foe.' },
  { id: 20, name: 'Ash',               cat: 'material',                qty: 23,                  desc: 'For warding lines.' },
  { id: 21, name: 'Bone Dust',          cat: 'material',                qty: 7,                   desc: 'Catalyst for Body skills.' },
  { id: 22, name: "Saint's Tears",      cat: 'material',                qty: 1,                   desc: 'A relic. Trade only.' },
  { id: 30, name: "Hierophant's Tooth", cat: 'quest',                   qty: 1,                   desc: 'Token from a slain priest. Reek of incense.' },
  { id: 31, name: 'Sealed Letter',      cat: 'quest',                   qty: 1,                   desc: 'For the woman in Ash Mire.' },
];

const TABS = [
  { k: 'all' as const,        l: 'ALL' },
  { k: 'equipment' as const,  l: 'WORN' },
  { k: 'consumable' as const, l: 'PHIALS' },
  { k: 'material' as const,   l: 'STUFF' },
  { k: 'quest' as const,      l: 'SEALED' },
];

function ItemGlyph({ cat, sub }: { cat: ItemCategory; sub?: string }) {
  if (cat === 'equipment' && sub === 'Weapon') return <ActionIcon kind="sword" size={32} color={AXM.parchment} />;
  if (cat === 'equipment' && sub === 'Armor')  return <ActionIcon kind="shield" size={32} color={AXM.parchment} />;
  if (cat === 'equipment') return (
    <Svg viewBox="0 0 32 32" width={32} height={32} fill="none" stroke={AXM.parchment} strokeWidth={2}>
      <Path d="M6 8 L 26 8 L 22 26 L 10 26 Z" />
    </Svg>
  );
  if (cat === 'consumable') return (
    <Svg viewBox="0 0 32 32" width={32} height={32} fill="none" stroke={AXM.parchment} strokeWidth={2}>
      <Path d="M12 4 H 20 V 12 L 24 24 C 24 27 22 28 16 28 C 10 28 8 27 8 24 L 12 12 Z" fill={AXM.parchment} fillOpacity={0.2} />
      <Path d="M12 4 H 20" strokeWidth={3} />
    </Svg>
  );
  if (cat === 'material') return (
    <Svg viewBox="0 0 32 32" width={32} height={32} fill={AXM.parchment}>
      <Circle cx={10} cy={14} r={3} />
      <Circle cx={20} cy={10} r={2.5} />
      <Circle cx={22} cy={20} r={3.5} />
      <Circle cx={12} cy={22} r={2} />
      <Circle cx={16} cy={16} r={2} />
    </Svg>
  );
  if (cat === 'quest') return <ActionIcon kind="scroll" size={32} color={AXM.sulfur} />;
  return null;
}

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<'all' | ItemCategory>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = activeTab === 'all' ? ITEMS : ITEMS.filter(i => i.cat === activeTab);

  return (
    <ScreenBg>
      {/* Header */}
      <View style={styles.header}>
        <SectionLabel size={9} color={AXM.bone}>SACK · WALLET · BURDEN</SectionLabel>
        <View style={styles.headerRow}>
          <Text style={styles.title}>INVENTORY</Text>
          <View style={styles.shillingBox}>
            <Text style={styles.shillingLabel}>SHILLING</Text>
            <Text style={styles.shillingVal}>⚜ 47</Text>
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <StatBar value={31} max={50} color={AXM.rust} label="BURDEN · STONE" height={9} />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity key={t.k} onPress={() => setActiveTab(t.k)} style={[styles.tab, activeTab === t.k && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t.k && styles.tabTextActive]}>{t.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Item Grid */}
      <View style={styles.gridOuter}>
        <View style={styles.grid}>
          {filtered.map(it => {
            const isExp = expandedId === it.id;
            return (
              <TouchableOpacity
                key={it.id}
                onPress={() => setExpandedId(isExp ? null : it.id)}
                style={[styles.itemCard, isExp && styles.itemCardExpanded, { borderColor: it.equipped ? AXM.sulfur : AXM.ash, borderWidth: it.equipped ? 2 : 1 }]}
              >
                <View style={styles.itemIcon}>
                  <ItemGlyph cat={it.cat} sub={it.sub} />
                </View>
                <Text style={styles.itemName} numberOfLines={isExp ? undefined : 2}>{it.name}</Text>

                {it.qty > 1 && (
                  <View style={styles.qtyBadge}>
                    <Text style={styles.qtyText}>×{it.qty}</Text>
                  </View>
                )}
                {it.equipped && (
                  <View style={styles.wornBadge}>
                    <Text style={styles.wornText}>WORN</Text>
                  </View>
                )}

                {isExp && (
                  <View style={styles.expandedContent}>
                    <Text style={styles.itemDesc}>"{it.desc}"</Text>
                    <View style={styles.actionsRow}>
                      {it.cat === 'equipment' && (
                        <TouchableOpacity style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>{it.equipped ? 'UNEQUIP' : 'EQUIP'}</Text>
                        </TouchableOpacity>
                      )}
                      {it.cat === 'consumable' && (
                        <TouchableOpacity style={styles.actionBtn}>
                          <Text style={styles.actionBtnText}>USE</Text>
                        </TouchableOpacity>
                      )}
                      {it.cat !== 'quest' && (
                        <TouchableOpacity style={[styles.actionBtn, styles.discardBtn]}>
                          <Text style={[styles.actionBtnText, { color: AXM.blood }]}>DISCARD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: AXM.ash, marginHorizontal: 10, marginTop: 12, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 6, paddingHorizontal: 4, backgroundColor: 'transparent' },
  tabActive: { backgroundColor: AXM.parchment },
  tabText: { fontFamily: FONTS.gothic, fontSize: 12, letterSpacing: 1, color: AXM.parchment, textAlign: 'center' },
  tabTextActive: { color: '#0a0a0a' },
  gridOuter: { paddingHorizontal: 10, paddingBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  itemCard: {
    width: '31.5%',
    backgroundColor: '#100d0a',
    padding: 6,
    minHeight: 92,
    position: 'relative',
  },
  itemCardExpanded: { width: '100%' },
  itemIcon: { width: '100%', height: 50, backgroundColor: '#06050a', borderWidth: 1, borderColor: AXM.ash, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontFamily: FONTS.gothic, fontSize: 11, color: AXM.parchment, lineHeight: 14, marginTop: 4 },
  qtyBadge: { position: 'absolute', top: 2, right: 2, backgroundColor: AXM.parchment, paddingHorizontal: 4 },
  qtyText: { fontFamily: FONTS.mono, fontSize: 10, color: '#0a0a0a' },
  wornBadge: { position: 'absolute', top: 2, left: 2, backgroundColor: AXM.sulfur, paddingHorizontal: 3 },
  wornText: { fontFamily: FONTS.sans, fontSize: 7, letterSpacing: 1, color: '#0a0a0a' },
  expandedContent: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: AXM.ash, borderStyle: 'dashed' },
  itemDesc: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone },
  actionsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  actionBtn: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, backgroundColor: 'transparent', borderWidth: 1, borderColor: AXM.parchment, alignItems: 'center' },
  discardBtn: { borderColor: AXM.blood },
  actionBtnText: { fontFamily: FONTS.gothic, fontSize: 11, letterSpacing: 1.5, color: AXM.parchment },
});

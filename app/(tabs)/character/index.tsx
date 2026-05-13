import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { StanceGlyph } from '@/components/StanceGlyph';
import { EffectGlyph } from '@/components/EffectGlyph';
import { XpChain } from '@/components/XpChain';
import { BodyDiagram } from '@/components/BodyDiagram';
import { useGameState } from '@/state/GameStoreProvider';
import { selectCharacterViewModel } from '@/state/presenters/character.engine';

export default function CharacterScreen() {
  const vm = useGameState(selectCharacterViewModel);

  return (
    <ScreenBg>
      {/* Header */}
      <View style={styles.header}>
        <SectionLabel size={9} color={AXM.bone}>{vm.subtitle}</SectionLabel>
        <View style={styles.headerRow}>
          <Text style={styles.characterName}>{vm.displayName}</Text>
          <View style={styles.levelBox}>
            <Text style={styles.levelText}>{vm.level}</Text>
          </View>
        </View>
        <View style={{ marginTop: 8 }}>
          <View style={styles.xpRow}>
            <Text style={styles.xpLabel}>XP CHAIN TO LVL {vm.level + 1}</Text>
            <Text style={styles.xpValue}>{vm.xp} / {vm.xpMax}</Text>
          </View>
          <XpChain value={vm.xp} max={vm.xpMax} />
        </View>
      </View>

      {/* Base Stats */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ BASE</SectionLabel>
        <View style={styles.baseRow}>
          {vm.base.map((r) => (
            <View key={r.stanceKey} style={styles.baseCard}>
              <StanceGlyph kind={r.stanceKey} size={28} color={AXM.parchment} />
              <Text style={styles.baseStatLabel}>{r.label}</Text>
              <Text style={styles.baseStatValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Derived Stats */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ DERIVED</SectionLabel>
        <View style={styles.derivedTable}>
          <View style={[styles.derivedRow, styles.derivedHeader]}>
            <Text style={[styles.derivedCell, styles.derivedRowLabel]} />
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>ATK</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>SKL</Text>
            <Text style={[styles.derivedCell, styles.derivedHeaderCell]}>DEF</Text>
          </View>
          {vm.derived.map((row) => (
            <View key={row.label} style={[styles.derivedRow, styles.derivedDataRow]}>
              <Text style={[styles.derivedCell, styles.derivedRowLabel]}>{row.label}</Text>
              <Text style={[styles.derivedCell, styles.derivedData]}>{row.attack}</Text>
              <Text style={[styles.derivedCell, styles.derivedData]}>{row.skill}</Text>
              <Text style={[styles.derivedCell, styles.derivedData]}>{row.defense}</Text>
            </View>
          ))}
          <View style={styles.luckRow}>
            <Text style={styles.luckLabel}>LUCK · AVG OF THREE</Text>
            <Text style={styles.luckValue}>{vm.luck}</Text>
          </View>
        </View>
      </View>

      {/* Saves & Tests */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ SAVES &amp; TESTS</SectionLabel>
        <View style={styles.savesGrid}>
          {vm.saves.map((s) => (
            <View key={s.label} style={styles.saveCell}>
              <Text style={styles.saveKey}>{s.label}</Text>
              <Text style={styles.saveVal}>{s.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Afflictions & Blessings */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ AFFLICTIONS &amp; BLESSINGS</SectionLabel>
        <View style={styles.effectsList}>
          {vm.effects.length === 0 ? (
            <Text style={styles.emptyLabel}>NO ACTIVE EFFECTS</Text>
          ) : (
            vm.effects.map((e) => (
              <View
                key={e.name}
                style={[
                  styles.effectRow,
                  {
                    backgroundColor: e.tint === 'buff' ? AXM.buff : AXM.debuff,
                    borderColor: e.tint === 'buff' ? AXM.sulfur : AXM.blood,
                  },
                ]}
              >
                <EffectGlyph kind={e.kind} size={20} color={e.tint === 'buff' ? AXM.sulfur : AXM.blood} />
                <View style={{ flex: 1 }}>
                  <View style={styles.effectTopRow}>
                    <Text style={styles.effectName}>{e.name}</Text>
                    <Text style={styles.effectMeta}>
                      {e.duration === null ? '∞' : `${e.duration}r`} · ×{e.intensity}
                    </Text>
                  </View>
                  <Text style={styles.effectDesc}>{e.description}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <SectionLabel size={10}>✠ WORN &amp; WIELDED</SectionLabel>
        <View style={styles.equipRow}>
          <BodyDiagram />
          <View style={styles.slotsGrid}>
            {vm.equipment.map((s) => (
              <View key={s.name} style={[styles.slotCell, s.item === null && styles.slotEmpty]}>
                <Text style={styles.slotName}>{s.name.toUpperCase()}</Text>
                <Text style={[styles.slotItem, s.item === null && { color: AXM.ash }]}>
                  {s.item ?? '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Skills */}
      {vm.skills.length > 0 && (
        <View style={styles.section}>
          <SectionLabel size={10}>✠ FALLACIES &amp; PARADOXES</SectionLabel>
          <View style={styles.skillsGrid}>
            {vm.skills.map((s) => (
              <View
                key={s.name}
                style={[
                  styles.skillCard,
                  {
                    borderColor: s.category === 'paradox' ? AXM.sulfur : AXM.parchment,
                    borderStyle: s.category === 'paradox' ? 'solid' : 'dashed',
                  },
                ]}
              >
                <StanceGlyph kind={s.stanceKey} size={16} color={AXM.bone} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.skillName}>{s.name}</Text>
                  <Text style={[styles.skillCat, { color: s.category === 'paradox' ? AXM.sulfur : AXM.parchment }]}>
                    {s.category.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { padding: 14, paddingBottom: 0 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  characterName: { fontFamily: FONTS.gothic, fontSize: 26, lineHeight: 28, color: AXM.parchment, marginTop: 2 },
  levelBox: { width: 50, height: 50, borderWidth: 2, borderColor: AXM.parchment, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  levelText: { fontFamily: FONTS.gothic, fontSize: 30, color: AXM.sulfur },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  xpLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, letterSpacing: 1 },
  xpValue: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.sulfur },
  section: { padding: 10, paddingHorizontal: 14, paddingBottom: 0 },
  baseRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  baseCard: { flex: 1, padding: 8, paddingHorizontal: 6, backgroundColor: '#100d0a', borderWidth: 1, borderColor: AXM.ash, alignItems: 'center' },
  baseStatLabel: { fontFamily: FONTS.sans, fontSize: 10, letterSpacing: 2, color: AXM.bone, marginTop: 2 },
  baseStatValue: { fontFamily: FONTS.gothic, fontSize: 28, color: AXM.sulfur, lineHeight: 32 },
  derivedTable: { marginTop: 4, backgroundColor: '#100d0a', borderWidth: 1, borderColor: AXM.ash, padding: 6, paddingHorizontal: 8 },
  derivedRow: { flexDirection: 'row' },
  derivedHeader: { borderBottomWidth: 1, borderBottomColor: AXM.ash, borderStyle: 'dashed', paddingBottom: 3, marginBottom: 0 },
  derivedDataRow: { borderBottomWidth: 1, borderBottomColor: '#1a1814', paddingVertical: 3 },
  derivedCell: { flex: 1 },
  derivedRowLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.parchment, letterSpacing: 1.5, flex: 1.2 },
  derivedHeaderCell: { fontFamily: FONTS.mono, fontSize: 10, color: AXM.bone, textAlign: 'right', letterSpacing: 1 },
  derivedData: { fontFamily: FONTS.gothic, fontSize: 14, color: AXM.parchment, textAlign: 'right' },
  luckRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  luckLabel: { fontFamily: FONTS.sans, fontSize: 11, color: AXM.bone, letterSpacing: 1.5 },
  luckValue: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.sulfur },
  savesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  saveCell: { width: '31%', borderWidth: 1, borderColor: AXM.ash, borderStyle: 'dashed', padding: 3, paddingHorizontal: 5, flexDirection: 'row', justifyContent: 'space-between' },
  saveKey: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  saveVal: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.parchment },
  effectsList: { marginTop: 4, gap: 4 },
  emptyLabel: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.ash, letterSpacing: 1 },
  effectRow: { flexDirection: 'row', gap: 8, alignItems: 'center', borderWidth: 1, padding: 5, paddingHorizontal: 7 },
  effectTopRow: { flexDirection: 'row', justifyContent: 'space-between' },
  effectName: { fontFamily: FONTS.gothic, fontSize: 13, color: AXM.parchment, letterSpacing: 1 },
  effectMeta: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone },
  effectDesc: { fontFamily: FONTS.serif, fontSize: 10, color: AXM.bone, lineHeight: 13, marginTop: 1 },
  equipRow: { flexDirection: 'row', gap: 10, marginTop: 6, alignItems: 'flex-start' },
  slotsGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  slotCell: { width: '48%', borderWidth: 1, borderColor: AXM.ash, padding: 3, paddingHorizontal: 5, minHeight: 32, backgroundColor: '#100d0a' },
  slotEmpty: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  slotName: { fontFamily: FONTS.sans, fontSize: 8, letterSpacing: 1.5, color: AXM.bone },
  slotItem: { fontFamily: FONTS.serif, fontSize: 11, color: AXM.parchment, lineHeight: 14 },
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  skillCard: { width: '48%', borderWidth: 2, padding: 4, paddingHorizontal: 6, backgroundColor: '#0a0a0a', flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillName: { fontFamily: FONTS.gothic, fontSize: 12, color: AXM.parchment, lineHeight: 14 },
  skillCat: { fontFamily: FONTS.mono, fontSize: 8, letterSpacing: 1 },
});

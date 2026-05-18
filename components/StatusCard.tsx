import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { StatBar } from './StatBar';
import { SectionLabel } from './SectionLabel';

interface StatusCardProps {
  name?: string;
  level?: number;
  hp?: number;
  hpMax?: number;
  mana?: number;
  manaMax?: number;
}

export function StatusCard({
  name = 'WORM-EATEN PILGRIM',
  level = 7,
  hp = 22,
  hpMax = 38,
  mana = 9,
  manaMax = 14,
}: StatusCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.levelBox}>
          <Text style={styles.levelText}>{level}</Text>
        </View>
        <View style={styles.nameCol}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <SectionLabel size={9} style={{ color: AXM.bone, marginTop: 2 }}>
            LEVEL · LVL {level} PILGRIM
          </SectionLabel>
        </View>
      </View>
      <View style={styles.barsRow}>
        <View style={styles.bar}>
          <StatBar value={hp} max={hpMax} color={AXM.blood} label="HP" height={9} />
        </View>
        <View style={styles.bar}>
          <StatBar value={mana} max={manaMax} color={AXM.sulfur} label="MP" height={9} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 8,
    marginBottom: 0,
    padding: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: AXM.panelBg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBox: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: AXM.parchment,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: FONTS.gothic,
    fontSize: 22,
    color: AXM.sulfur,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FONTS.gothic,
    fontSize: 15,
    lineHeight: 18,
    color: AXM.parchment,
    letterSpacing: 1,
  },
  barsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  bar: {
    flex: 1,
  },
});

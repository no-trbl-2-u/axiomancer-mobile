import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';

const TIER_MAP: Record<string, { c: string; label: string }> = {
  simple: { c: AXM.bone, label: 'SIMPLE' },
  normal: { c: AXM.parchment, label: 'NORMAL' },
  elite: { c: AXM.sulfur, label: 'ELITE' },
  boss: { c: AXM.blood, label: 'BOSS' },
  unique: { c: AXM.rust, label: 'UNIQUE' },
};

interface DifficultyBadgeProps {
  tier?: string;
}

export function DifficultyBadge({ tier = 'normal' }: DifficultyBadgeProps) {
  const m = TIER_MAP[tier] || TIER_MAP.normal;
  return (
    <View style={[styles.badge, { borderColor: m.c }]}>
      <View style={[styles.dot, { backgroundColor: m.c }]} />
      <Text style={[styles.text, { color: m.c }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dot: {
    width: 5,
    height: 5,
  },
  text: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 2,
  },
});

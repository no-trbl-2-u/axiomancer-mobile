import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { DimensionValue } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';

interface StatBarProps {
  value: number;
  max: number;
  color?: string;
  label?: string;
  height?: number;
  showText?: boolean;
}

export function StatBar({ value, max, color = AXM.blood, label, height = 14, showText = true }: StatBarProps) {
  const pct = Math.max(0, Math.min(1, value / max));

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {showText && <Text style={styles.value}>{value}/{max}</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View style={[styles.fill, { width: `${(pct * 100).toFixed(1)}%` as DimensionValue, backgroundColor: color }]} />
        <View style={styles.topLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  label: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    letterSpacing: 2,
    color: AXM.parchment,
    opacity: 0.85,
  },
  value: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: AXM.parchment,
    opacity: 0.85,
  },
  track: {
    width: '100%',
    backgroundColor: '#1a1814',
    borderWidth: 1,
    borderColor: 'rgba(232,223,200,0.35)',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(232,223,200,0.4)',
  },
});

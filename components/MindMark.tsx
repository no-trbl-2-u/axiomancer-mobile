import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';

interface MindMarkProps {
  stacks?: number;
}

export function MindMark({ stacks = 0 }: MindMarkProps) {
  if (stacks <= 0) return null;
  return (
    <View style={styles.badge}>
      <Svg viewBox="0 0 12 12" width={10} height={10}>
        <Circle cx={6} cy={6} r={4.5} fill="none" stroke={AXM.sulfur} strokeWidth={1} />
        <Circle cx={6} cy={6} r={1.5} fill={AXM.sulfur} />
        <Path d="M6 0 V 2 M 6 10 V 12 M 0 6 H 2 M 10 6 H 12" stroke={AXM.sulfur} strokeWidth={1} />
      </Svg>
      <Text style={styles.text}>MARK ×{stacks}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 1,
    paddingHorizontal: 4,
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: AXM.sulfur,
    borderStyle: 'dashed',
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: AXM.sulfur,
    letterSpacing: 0.5,
  },
});

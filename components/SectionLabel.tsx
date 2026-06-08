import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';

interface SectionLabelProps {
  children: React.ReactNode;
  color?: string;
  size?: number;
  style?: object;
}

export const SectionLabel = React.memo(function SectionLabel({ children, color = AXM.parchment, size = 11, style }: SectionLabelProps) {
  return (
    <Text 
      style={[styles.base, { color, fontSize: size }, style]}
      accessibilityRole="header"
      accessibilityLabel={`Section: ${children}`}
    >
      {children}
    </Text>
  );
});

const styles = StyleSheet.create({
  base: {
    fontFamily: FONTS.sans,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});

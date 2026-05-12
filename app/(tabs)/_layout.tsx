import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { useCombatMode } from '@/state/combat-mode';
import { isTabHidden } from './_layout.engine';

function TabIcon({ kind, color, size }: { kind: string; color: string; size: number }) {
  switch (kind) {
    case 'eye':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M2 16 C 8 6 24 6 30 16 C 24 26 8 26 2 16 Z" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={2} />
          <Circle cx={16} cy={16} r={5} fill={color} />
        </Svg>
      );
    case 'sword':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      );
    case 'crown':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M3 10 L8 22 H24 L29 10 L23 14 L16 6 L9 14 Z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M3 26 H29" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'bag':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M8 10 H24 L26 28 H6 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M11 10 V7 A5 5 0 0 1 21 7 V10" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'scroll':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M6 6 H26 V22 C26 25 24 27 21 27 H8 C5 27 3 25 3 22 V9 C3 7 5 5 6 6 Z" fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M10 12 H22 M 10 16 H22 M 10 20 H18" stroke={color} strokeWidth={2} />
        </Svg>
      );
    default:
      return null;
  }
}

export default function TabLayout() {
  const { inCombat } = useCombatMode();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: AXM.sulfur,
        tabBarInactiveTintColor: AXM.bone,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="exploration"
        options={{
          title: 'MAP',
          tabBarIcon: ({ color, size }) => <TabIcon kind="eye" color={color} size={size} />,
          href: isTabHidden(inCombat, 'exploration') ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="combat"
        options={{
          title: 'COMBAT',
          tabBarIcon: ({ color, size }) => <TabIcon kind="sword" color={color} size={size} />,
          href: isTabHidden(inCombat, 'combat') ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="character"
        options={{
          title: 'SHEET',
          tabBarIcon: ({ color, size }) => <TabIcon kind="crown" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'SACK',
          tabBarIcon: ({ color, size }) => <TabIcon kind="bag" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="event"
        options={{
          title: 'EVENT',
          tabBarIcon: ({ color, size }) => <TabIcon kind="scroll" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#100d0a',
    borderTopColor: AXM.ash,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
  },
  tabLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    letterSpacing: 2,
  },
});

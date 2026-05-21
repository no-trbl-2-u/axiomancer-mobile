import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { useCombatMode } from '@/state/combat-mode';
import { isTabHidden, TAB_TITLES } from '@/state/presenters/tabs.engine';
import { useGameState } from '@/state/GameStoreProvider';
import { selectTabBadges } from '@/state/presenters/navigation.engine';
import { selectHasActiveCombatPrelude } from '@/state/presenters/event.engine';

function TabBadge({ text, kind }: { text: string; kind: 'event' | 'levelup' }) {
  const badgeColor = kind === 'levelup' ? AXM.sulfur : AXM.blood;
  
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor }]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function TabIconWithBadge({ 
  kind, 
  color, 
  size, 
  badge 
}: { 
  kind: string; 
  color: string; 
  size: number; 
  badge: { text: string; kind: 'event' | 'levelup' } | null;
}) {
  return (
    <View style={styles.iconContainer}>
      <TabIcon kind={kind} color={color} size={size} />
      {badge && <TabBadge text={badge.text} kind={badge.kind} />}
    </View>
  );
}

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
  const { inCombat, inEncounterModal } = useCombatMode();
  // Phase 42 port: extend the WILDS/STRIFE mutex to fire as soon as
  // the combat-prelude event mounts (the `<EncounterModalOverlay>`),
  // not just when combat actually starts. Mirrors prototype.jsx:42
  // `combatTabShown = route === 'strife' || modal?.kind ===
  // 'event-combat'`. Without this, the player taps an encounter
  // node and sees the modal but the tab bar still reads WILDS until
  // they pick FIGHT — visual continuity gap.
  const hasCombatPrelude = useGameState(selectHasActiveCombatPrelude);
  // Phase 63c regression fix (2026-05-21): pickEventChoice('fight')
  // clears the event slice AND starts combat, which flipped
  // `combatContext` true via `inCombat`. The exploration tab's
  // href became null → expo-router navigated AWAY from
  // exploration → the modal (which lives inside
  // <ExplorationScreen>) unmounted → user saw the combat tab
  // (or nothing). When the encounter modal is active, the tab
  // mutex must NOT swap WILDS↔STRIFE — the user has to stay on
  // exploration so the modal stays mounted. The modal's internal
  // mode flips prelude → combat; the combat tab is irrelevant
  // while the modal session is alive.
  const combatContext = (inCombat || hasCombatPrelude) && !inEncounterModal;
  // Subscribe to the slim slices `selectTabBadges` reads, then memo
  // the badges object. The presenter returns a stable `EMPTY_BADGES`
  // reference in the no-event / no-levelup steady state but a fresh
  // object whenever a badge is active — passed directly to
  // `useGameState`, the active-badge path would over-render this
  // layout on every unrelated store change (engine events fire on
  // most actions). Slim-slice + memo mirrors the character / event
  // screen pattern.
  const player = useGameState((s) => s.player);
  const eventSlice = useGameState((s) => s.event);
  const combat = useGameState((s) => s.combat);
  const notifications = useGameState((s) => s.notifications);
  const badges = useMemo(
    () =>
      selectTabBadges({
        player,
        event: eventSlice,
        combat,
        notifications,
      } as never),
    [player, eventSlice, combat, notifications],
  );

  // Phase 63c — hard-stop the tab bar while the encounter modal is
  // open (prelude / in-modal combat / aftermath). The chat1 contract
  // says "user cannot exit these modals". Implemented via `href: null`
  // on every non-exploration tab (exploration stays navigable so the
  // modal-bearing screen remains mounted). The tab bar visually stays
  // to maintain layout stability; tab buttons just become non-tappable
  // (gray-out via accessibilityState on the navigator).
  const lockOtherTabs = inEncounterModal;

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
        name="exploration/index"
        options={{
          title: TAB_TITLES.exploration,
          tabBarLabel: TAB_TITLES.exploration,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="eye"
              color={color}
              size={size}
              badge={badges.exploration}
            />
          ),
          href: isTabHidden(combatContext, 'exploration') ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="combat"
        options={{
          title: TAB_TITLES.combat,
          tabBarLabel: TAB_TITLES.combat,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge 
              kind="sword" 
              color={color} 
              size={size} 
              badge={badges.combat} 
            />
          ),
          href: isTabHidden(combatContext, 'combat') ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="character/index"
        options={{
          title: TAB_TITLES.character,
          tabBarLabel: TAB_TITLES.character,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="crown"
              color={color}
              size={size}
              badge={badges.character}
            />
          ),
          href: lockOtherTabs ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="memoir/index"
        options={{
          title: TAB_TITLES.memoir,
          tabBarLabel: TAB_TITLES.memoir,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="scroll"
              color={color}
              size={size}
              badge={badges.memoir}
            />
          ),
          href: lockOtherTabs ? null : undefined,
        }}
      />
      <Tabs.Screen
        name="inventory/index"
        options={{
          title: TAB_TITLES.inventory,
          tabBarLabel: TAB_TITLES.inventory,
          tabBarIcon: ({ color, size }) => (
            <TabIconWithBadge
              kind="bag"
              color={color}
              size={size}
              badge={badges.inventory}
            />
          ),
          href: lockOtherTabs ? null : undefined,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: AXM.panelBg,
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
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: AXM.parchment,
    fontFamily: FONTS.sans,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 16,
  },
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, {
  Path, Circle, Line, G, Defs, Pattern,
  Text as SvgText,
} from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { ScreenBg } from '@/components/ScreenBg';
import { StatusCard } from '@/components/StatusCard';
import { SectionLabel } from '@/components/SectionLabel';
import { NodeMark } from '@/components/NodeMark';
import { ActionIcon } from '@/components/ActionIcon';
import { Splatter } from '@/components/Splatter';
import { useCombatMode } from '@/state/combat-mode';

const NODES = [
  { id: 'n0', x: 60,  y: 380, kind: 'completed' as const, label: 'Hovel',          type: 'rest' },
  { id: 'n1', x: 130, y: 320, kind: 'completed' as const, label: 'Crossing',        type: 'gather' },
  { id: 'n2', x: 200, y: 250, kind: 'current'   as const, label: 'Hanged Wood',     type: 'current' },
  { id: 'n3', x: 290, y: 200, kind: 'available' as const, label: 'Black Cairn',     type: 'encounter' },
  { id: 'n4', x: 130, y: 180, kind: 'available' as const, label: 'Drowned Shrine',  type: 'treasure' },
  { id: 'n5', x: 250, y: 110, kind: 'locked'    as const, label: '???',             type: 'boss' },
  { id: 'n6', x: 70,  y: 100, kind: 'locked'    as const, label: 'Ash Mire',        type: 'quest' },
];

const EDGES: [string, string][] = [
  ['n0','n1'], ['n1','n2'], ['n2','n3'], ['n2','n4'],
  ['n3','n5'], ['n4','n5'], ['n4','n6'],
];

const EVENT_BADGE: Record<string, { c: string; label: string }> = {
  encounter: { c: AXM.blood,  label: 'ENCOUNTER' },
  treasure:  { c: AXM.sulfur, label: 'TREASURE' },
  boss:      { c: AXM.blood,  label: 'BOSS' },
  quest:     { c: AXM.sulfur, label: 'QUEST' },
  rest:      { c: AXM.rust,   label: 'REST' },
  gather:    { c: AXM.bone,   label: 'GATHER' },
};

const ACTIONS = [
  { label: 'Venture\nNorth',     icon: 'flee',   tag: 'TRAVEL · 1 TURN', selected: true },
  { label: 'Search\nthe Hanged', icon: 'eye',    tag: 'SKILL · MIND',    selected: false },
  { label: 'Gather\nFungi',      icon: 'bag',    tag: 'NODE · GATHER',   selected: false },
  { label: 'Rest by\nFire',      icon: 'flame',  tag: 'HEAL · COSTLY',   selected: false },
  { label: 'Read\nRunes',        icon: 'scroll', tag: 'LORE',            selected: false },
];

function rnd(i: number) {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const ENCOUNTER_NODE_TYPES = new Set(['encounter', 'boss']);

export default function ExplorationScreen() {
  const get = (id: string) => NODES.find(n => n.id === id)!;
  const router = useRouter();
  const { enterCombat } = useCombatMode();

  const triggerCombat = () => {
    enterCombat();
    router.replace('/combat' as any);
  };

  return (
    <ScreenBg>
      <StatusCard />

      {/* Region Header */}
      <View style={styles.regionHeader}>
        <View>
          <SectionLabel size={9} style={{ color: AXM.bone }}>CONTINENT · IRON SKY</SectionLabel>
          <Text style={styles.regionTitle}>The Hanged Wood</Text>
          <Text style={styles.regionSub}>Map ii of vii · 4 paths remain</Text>
        </View>
        <View style={styles.dayBox}>
          <Text style={styles.dayLabel}>DAY</Text>
          <Text style={styles.dayNum}>XXIV</Text>
        </View>
      </View>

      {/* Node Graph */}
      <View style={styles.graphWrap}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#16130d' }]} />
        <Splatter color={AXM.blood} size={170} seed={3} style={{ position: 'absolute', top: -10, right: -10, opacity: 0.35 }} />
        <Splatter color={AXM.sulfur} size={130} seed={9} style={{ position: 'absolute', bottom: 30, left: -20, opacity: 0.18 }} />

        {/* Compass */}
        <Text style={styles.compass}>N ↑ · scale: leagues</Text>
        <Text style={styles.nodeGraphLabel}>NODE GRAPH</Text>

        {/* SVG edges and nodes */}
        <Svg viewBox="0 0 360 400" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
          {EDGES.map(([a, b], i) => {
            const A = get(a), B = get(b);
            const isLocked = A.kind === 'locked' || B.kind === 'locked';
            const traveled = A.kind === 'completed' && (B.kind === 'completed' || B.kind === 'current');
            const mx = (A.x + B.x) / 2 + Math.sin(i * 3) * 12;
            const my = (A.y + B.y) / 2 + Math.cos(i * 5) * 10;
            return (
              <G key={i}>
                <Path
                  d={`M ${A.x} ${A.y} Q ${mx} ${my} ${B.x} ${B.y}`}
                  stroke={traveled ? AXM.parchment : (isLocked ? AXM.ash : AXM.bone)}
                  strokeWidth={traveled ? 2.5 : 1.6}
                  strokeDasharray={isLocked ? '4 4' : undefined}
                  fill="none"
                  opacity={traveled ? 0.9 : 0.6}
                  strokeLinecap="round"
                />
                {traveled && <Circle cx={mx} cy={my} r={2} fill={AXM.sulfur} />}
              </G>
            );
          })}
          {/* Hand-drawn region scribbles */}
          <G opacity={0.4} stroke={AXM.bone} strokeWidth={1} fill="none">
            <Path d="M40 250 q 20 -20 40 -10 q 10 12 -10 18 q -22 4 -30 -8 z" />
            <Path d="M250 280 q 30 -20 60 -5 q 8 18 -20 22 q -38 -2 -40 -17 z" />
          </G>
        </Svg>

        {/* Node markers as absolutely positioned Views */}
        {NODES.map(n => {
          const ev = EVENT_BADGE[n.type] || EVENT_BADGE.encounter;
          const left = (n.x - 18) / 360 * 100;
          const top = (n.y - 18) / 400 * 100;
          const triggers = n.kind === 'available' && ENCOUNTER_NODE_TYPES.has(n.type);
          const Wrap: any = triggers ? TouchableOpacity : View;
          return (
            <Wrap
              key={n.id}
              accessibilityRole={triggers ? 'button' : undefined}
              accessibilityLabel={triggers ? `Engage ${n.label}` : undefined}
              onPress={triggers ? triggerCombat : undefined}
              style={[styles.nodeWrap, { left: `${left}%` as any, top: `${top}%` as any }]}
            >
              <NodeMark kind={n.kind} size={36} />
              <View style={[styles.nodeLabel, { opacity: n.kind === 'locked' ? 0.4 : 1 }]}>
                <Text style={[styles.nodeLabelText, { color: n.kind === 'locked' ? AXM.ash : AXM.parchment }]}>
                  {n.label}
                </Text>
              </View>
              {n.kind === 'available' && (
                <View style={[styles.nodeTypeBadge, { backgroundColor: ev.c }]}>
                  <Text style={styles.nodeTypeBadgeText}>{ev.label}</Text>
                </View>
              )}
            </Wrap>
          );
        })}

        {/* Floating event callout */}
        <View style={styles.eventCallout}>
          <View style={styles.eventCalloutRow}>
            <ActionIcon kind="eye" size={20} color={AXM.blood} />
            <SectionLabel size={9} color={AXM.blood}>NEW EVENT</SectionLabel>
          </View>
          <Text style={styles.eventCalloutText}>Something watches from Black Cairn.</Text>
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendText}>● TRODDEN  ◌ OPEN  ✕ SHUT</Text>
          <Text style={styles.legendText}>vii nodes · iii sealed</Text>
        </View>
      </View>

      {/* Action Drawer */}
      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <SectionLabel size={10}>★ At Hanged Wood</SectionLabel>
          <Text style={styles.swipeHint}>swipe →</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.drawerScroll}>
          {ACTIONS.map((a, i) => (
            <View key={i} style={[styles.actionCard, a.selected && styles.actionCardSelected]}>
              <ActionIcon kind={a.icon} size={22} color={a.selected ? AXM.sulfur : AXM.parchment} />
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={[styles.actionTag, { color: a.selected ? AXM.sulfur : AXM.bone }]}>{a.tag}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  regionHeader: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  regionTitle: {
    fontFamily: FONTS.gothic,
    fontSize: 26,
    lineHeight: 28,
    color: AXM.parchment,
    marginTop: 2,
  },
  regionSub: {
    fontFamily: FONTS.serif,
    fontSize: 11,
    color: AXM.bone,
    fontStyle: 'italic',
    marginTop: 1,
  },
  dayBox: {
    alignItems: 'flex-end',
  },
  dayLabel: {
    fontFamily: FONTS.mono,
    fontSize: 10,
    color: AXM.bone,
  },
  dayNum: {
    fontFamily: FONTS.gothic,
    fontSize: 22,
    color: AXM.sulfur,
    lineHeight: 24,
  },
  graphWrap: {
    marginHorizontal: 10,
    marginVertical: 6,
    height: 400,
    position: 'relative',
    overflow: 'hidden',
  },
  compass: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: AXM.bone,
    letterSpacing: 1,
    zIndex: 2,
  },
  nodeGraphLabel: {
    position: 'absolute',
    top: 10,
    right: 12,
    fontFamily: FONTS.gothic,
    fontSize: 14,
    color: AXM.parchment,
    opacity: 0.6,
    letterSpacing: 2,
    zIndex: 2,
  },
  nodeWrap: {
    position: 'absolute',
    width: 36,
    alignItems: 'center',
    zIndex: 3,
  },
  nodeLabel: {
    marginTop: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    backgroundColor: 'rgba(10,10,10,0.85)',
  },
  nodeLabelText: {
    fontFamily: FONTS.sans,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  nodeTypeBadge: {
    marginTop: 1,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  nodeTypeBadgeText: {
    fontFamily: FONTS.sans,
    fontSize: 8,
    letterSpacing: 1,
    color: '#0a0a0a',
  },
  eventCallout: {
    position: 'absolute',
    top: 50,
    right: 12,
    width: 130,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: AXM.blood,
    padding: 8,
    zIndex: 4,
  },
  eventCalloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventCalloutText: {
    fontFamily: FONTS.gothic,
    fontSize: 13,
    color: AXM.parchment,
    marginTop: 2,
    lineHeight: 15,
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  legendText: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    color: AXM.bone,
    letterSpacing: 1,
  },
  drawer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  swipeHint: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: AXM.bone,
  },
  drawerScroll: {
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  actionCard: {
    width: 110,
    height: 100,
    backgroundColor: '#100d0a',
    borderWidth: 1,
    borderColor: AXM.ash,
    padding: 8,
    paddingBottom: 6,
    justifyContent: 'space-between',
  },
  actionCardSelected: {
    borderWidth: 2,
    borderColor: AXM.sulfur,
    backgroundColor: '#1a1410',
  },
  actionLabel: {
    fontFamily: FONTS.gothic,
    fontSize: 13,
    lineHeight: 15,
    color: AXM.parchment,
  },
  actionTag: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    letterSpacing: 1,
  },
});

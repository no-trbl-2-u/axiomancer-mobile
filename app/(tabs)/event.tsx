import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, {
  Path, Circle, Ellipse, Line, Rect, G,
  Defs, RadialGradient, Stop,
} from 'react-native-svg';
import { AXM, FONTS } from '@/theme/axm';
import { ScreenBg } from '@/components/ScreenBg';
import { SectionLabel } from '@/components/SectionLabel';
import { ActionIcon } from '@/components/ActionIcon';
import { Splatter } from '@/components/Splatter';

type EventVariant = 'encounter' | 'boss';

const EVENT_DATA = {
  encounter: {
    badge: 'ENCOUNTER',
    badgeC: AXM.blood,
    title: 'A FIGURE STIRS\nIN THE ROT',
    sub: 'something with too many joints',
    body: 'It crawled out from under the cairn — patient as moss. Its mouth, where a mouth should be, makes the sound of bees made of teeth. It has not yet seen you.',
    choices: [
      { l: 'FIGHT',       sub: 'Combat · turns',   icon: 'sword',  accent: AXM.blood },
      { l: 'SNEAK PAST',  sub: 'Mind Test · 14',   icon: 'eye',    accent: AXM.parchment },
      { l: 'PARLEY',      sub: 'Heart Test · 12',  icon: 'scroll', accent: AXM.sulfur },
      { l: 'FLEE',        sub: 'Luck Save',         icon: 'flee',   accent: AXM.bone },
    ],
    lore: null,
  },
  boss: {
    badge: 'OMEN OF DOOM',
    badgeC: AXM.blood,
    title: 'THE GUTTED\nKING WAKES',
    sub: 'fourth seal · third sigh',
    body: 'You have come to the throne and the throne is a trough. The Gutted King smiles with three rows of nails. Above, the sky is a wound. Below, the ground forgets your name. There is no leaving now — only how.',
    choices: [
      { l: 'KNEEL',  sub: 'Offer thyself',  icon: 'crown', accent: AXM.sulfur },
      { l: 'STRIKE', sub: 'Combat · BOSS',  icon: 'sword', accent: AXM.blood },
    ],
    lore: '"He who counts the bones of saints shall sit beside Him until the lamps are out." — Cipher of Worms, fol. xliv',
  },
};

function EncounterIllustration() {
  return (
    <Svg viewBox="0 0 374 320" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
      <Line x1={0} y1={200} x2={374} y2={200} stroke={AXM.bone} strokeWidth={0.5} opacity={0.4} />
      {[40, 100, 280, 340].map((x, i) => (
        <G key={i}>
          <Path d={`M${x} 60 L ${x} 220`} stroke={AXM.parchment} strokeWidth={2} />
          <Path d={`M${x - 30} 90 L ${x + 30} 90 M ${x - 25} 130 L ${x + 20} 125`} stroke={AXM.parchment} strokeWidth={1.5} />
          <Ellipse cx={x} cy={130} rx={3} ry={6} fill={AXM.parchment} />
          <Line x1={x - 20} y1={90} x2={x - 20} y2={115} stroke={AXM.parchment} strokeWidth={1} />
          <Circle cx={x - 20} cy={120} r={4} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1} />
        </G>
      ))}
      <G transform="translate(187 200)">
        <Ellipse cx={0} cy={0} rx={60} ry={12} fill="#06050a" stroke={AXM.parchment} strokeWidth={1} />
        <Path d="M-50 0 L -55 -20 L -40 -30 L -25 -10 L -10 -38 L 5 -22 L 25 -45 L 38 -25 L 50 -8 L 55 0 Z"
          fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
        <G transform="translate(0 -50)">
          <Ellipse cx={0} cy={0} rx={14} ry={20} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
          {[[-6, -8], [6, -8], [-8, -2], [8, -2], [0, -12]].map((p, i) => (
            <Circle key={i} cx={p[0]} cy={p[1]} r={1.5} fill={AXM.blood} />
          ))}
          <Path d="M-12 0 L -28 8 L -22 18 M 12 0 L 28 8 L 22 18 M -10 14 L -20 26 M 10 14 L 20 26"
            stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
          <Path d="M-8 6 L 8 6" stroke={AXM.blood} strokeWidth={1.5} />
        </G>
      </G>
      <Circle cx={60} cy={50} r={20} fill="none" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M50 50 q 10 -8 20 0" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
      <G stroke={AXM.bone} strokeWidth={0.5} opacity={0.3}>
        {Array.from({ length: 60 }).map((_, i) => (
          <Line key={i} x1={i * 7} y1={210 + (i % 4) * 3} x2={i * 7 + 10} y2={210 + (i % 4) * 3} />
        ))}
      </G>
    </Svg>
  );
}

function BossIllustration() {
  return (
    <Svg viewBox="0 0 374 360" width="100%" height="100%" style={StyleSheet.absoluteFillObject}>
      <Path d="M40 20 L 40 200 L 100 80 L 187 30 L 274 80 L 334 200 L 334 20 Z"
        fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
      <Path d="M120 80 L 187 50 L 254 80" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
      <Circle cx={187} cy={130} r={60} fill="none" stroke={AXM.sulfur} strokeWidth={1} opacity={0.5} />
      <Circle cx={187} cy={130} r={80} fill="none" stroke={AXM.sulfur} strokeWidth={0.5} opacity={0.3} strokeDasharray="2 4" />
      <G transform="translate(187 130)">
        <Path d="M-30 -50 L -22 -75 L -15 -55 L -8 -82 L 0 -55 L 8 -82 L 15 -55 L 22 -75 L 30 -50 Z"
          fill={AXM.sulfur} stroke="#0a0a0a" strokeWidth={1} />
        <Path d="M-30 -50 L 30 -50 L 30 -45 L -30 -45 Z" fill={AXM.sulfur} />
        <Circle cx={0} cy={-66} r={2.5} fill={AXM.blood} />
        <Path d="M0 -75 L -3 -55 L 3 -45" stroke={AXM.blood} strokeWidth={1.5} fill="none" />
        <Ellipse cx={0} cy={-20} rx={22} ry={28} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1.5} />
        <Ellipse cx={-8} cy={-26} rx={4} ry={5} fill="#000" stroke={AXM.parchment} strokeWidth={1} />
        <Ellipse cx={8} cy={-26} rx={4} ry={5} fill="#000" stroke={AXM.parchment} strokeWidth={1} />
        <Circle cx={-8} cy={-26} r={1} fill={AXM.blood} />
        <Circle cx={8} cy={-26} r={1} fill={AXM.blood} />
        <Path d="M-12 -10 L 12 -10" stroke={AXM.parchment} strokeWidth={1} />
        {[-10, -7, -4, -1, 2, 5, 8, 11].map((x, i) => (
          <G key={i}>
            <Line x1={x} y1={-10} x2={x} y2={-5} stroke={AXM.parchment} strokeWidth={0.8} />
            <Line x1={x + 0.5} y1={-7} x2={x + 0.5} y2={-3} stroke={AXM.parchment} strokeWidth={0.8} />
          </G>
        ))}
        <Path d="M-30 5 L -36 80 L -10 90 L 10 90 L 36 80 L 30 5" fill="#06050a" stroke={AXM.parchment} strokeWidth={1.5} />
        <Path d="M-22 10 L -28 70 L 28 70 L 22 10 Z" fill="#3a0612" stroke={AXM.blood} strokeWidth={1} />
        {[15, 28, 41, 54, 67].map((y, i) => (
          <Path key={i} d={`M-22 ${y} Q 0 ${y - 5} 22 ${y}`} stroke={AXM.parchment} strokeWidth={1} fill="none" />
        ))}
        <Path d="M-30 10 L -54 80 L -50 130 M 30 10 L 54 80 L 50 130"
          stroke={AXM.parchment} strokeWidth={1.5} fill="none" />
        <Circle cx={-50} cy={135} r={5} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1} />
        <Circle cx={50} cy={135} r={5} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1} />
      </G>
      {[60, 314].map((x, i) => (
        <G key={i}>
          <Rect x={x - 3} y={240} width={6} height={80} fill="#0a0a0a" stroke={AXM.parchment} strokeWidth={1} />
          <Path d={`M${x} 235 q -3 -8 0 -15 q 3 8 0 15 z`} fill={AXM.sulfur} />
          <Path d={`M${x} 240 q -1 -4 0 -8 q 1 4 0 8 z`} fill={AXM.blood} />
        </G>
      ))}
    </Svg>
  );
}

export default function EventScreen() {
  const [variant, setVariant] = useState<EventVariant>('encounter');
  const d = EVENT_DATA[variant];
  const isBoss = variant === 'boss';

  return (
    <ScreenBg>
      {/* Variant toggle (for demo) */}
      <View style={styles.toggleRow}>
        <TouchableOpacity onPress={() => setVariant('encounter')} style={[styles.toggleBtn, variant === 'encounter' && styles.toggleBtnActive]}>
          <Text style={[styles.toggleText, variant === 'encounter' && styles.toggleTextActive]}>ENCOUNTER</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setVariant('boss')} style={[styles.toggleBtn, variant === 'boss' && styles.toggleBtnActive]}>
          <Text style={[styles.toggleText, variant === 'boss' && styles.toggleTextActive]}>BOSS</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={[styles.illustration, { height: isBoss ? 360 : 320 }]}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#06050a' }]} />
        {isBoss ? <BossIllustration /> : <EncounterIllustration />}
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: d.badgeC, borderColor: d.badgeC }]}>
            {isBoss ? '☠ ' : '✠ '}{d.badge}
          </Text>
        </View>
        <View style={styles.cornerIndex}>
          <Text style={styles.cornerIndexText}>SCENE iv · ix{'\n'}NODE: BLACK CAIRN</Text>
        </View>
        <Splatter color={AXM.blood} size={180} seed={45} style={{ position: 'absolute', top: -20, right: -30, opacity: isBoss ? 0.7 : 0.5 }} />
      </View>

      {/* Title */}
      <View style={styles.titleArea}>
        <Text style={[styles.eventTitle, isBoss && styles.eventTitleBoss]}>{d.title}</Text>
        <Text style={styles.eventSub}>— {d.sub}</Text>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.bodyText}>
          <Text style={styles.dropCap}>{d.body[0]}</Text>
          {d.body.slice(1)}
        </Text>
        {isBoss && d.lore && (
          <View style={styles.loreBox}>
            <Text style={styles.loreText}>{d.lore}</Text>
          </View>
        )}
      </View>

      {/* Choices */}
      <View style={styles.choices}>
        <SectionLabel size={10} style={{ marginBottom: 6 }}>✠ WHAT WILL YOU DO?</SectionLabel>
        {d.choices.map((c, i) => (
          <TouchableOpacity key={c.l} style={[styles.choiceRow, { borderColor: c.accent, backgroundColor: i === 0 ? '#1a0a0a' : '#0a0a0a' }]}>
            <ActionIcon kind={c.icon} size={24} color={c.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.choiceLabel}>{c.l}</Text>
              <Text style={styles.choiceSub}>{c.sub.toUpperCase()}</Text>
            </View>
            <Text style={[styles.choiceArrow, { color: c.accent }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  toggleRow: { flexDirection: 'row', padding: 8, paddingHorizontal: 14, gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 4, borderWidth: 1, borderColor: AXM.ash, alignItems: 'center' },
  toggleBtnActive: { borderColor: AXM.sulfur, backgroundColor: '#1a1810' },
  toggleText: { fontFamily: FONTS.sans, fontSize: 11, letterSpacing: 2, color: AXM.bone },
  toggleTextActive: { color: AXM.sulfur },
  illustration: { margin: 8, marginTop: 0, position: 'relative', overflow: 'hidden' },
  badge: { position: 'absolute', top: 12, left: 12, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#0a0a0a', borderWidth: 2, borderColor: AXM.blood },
  badgeText: { fontFamily: FONTS.gothic, fontSize: 14, letterSpacing: 2 },
  cornerIndex: { position: 'absolute', top: 14, right: 16 },
  cornerIndexText: { fontFamily: FONTS.mono, fontSize: 9, color: AXM.bone, textAlign: 'right' },
  titleArea: { paddingHorizontal: 14, paddingTop: 8 },
  eventTitle: { fontFamily: FONTS.gothic, fontSize: 28, lineHeight: 30, letterSpacing: 1, color: AXM.parchment },
  eventTitleBoss: { fontSize: 38, lineHeight: 40, textShadowColor: AXM.blood, textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 },
  eventSub: { fontFamily: FONTS.serifItalic, fontSize: 11, color: AXM.bone, marginTop: 2 },
  body: { paddingHorizontal: 14, paddingTop: 8 },
  bodyText: { fontFamily: FONTS.serif, fontSize: 12, color: AXM.parchment, lineHeight: 18 },
  dropCap: { fontFamily: FONTS.gothic, fontSize: 36, lineHeight: 34, color: AXM.blood },
  loreBox: { marginTop: 8, padding: 6, paddingHorizontal: 8, borderLeftWidth: 2, borderLeftColor: AXM.sulfur },
  loreText: { fontFamily: FONTS.serifItalic, fontSize: 10, color: AXM.sulfur, lineHeight: 14 },
  choices: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16, gap: 6 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 9, paddingHorizontal: 12, borderWidth: 2 },
  choiceLabel: { fontFamily: FONTS.gothic, fontSize: 18, color: AXM.parchment, lineHeight: 20, letterSpacing: 1.5 },
  choiceSub: { fontFamily: FONTS.mono, fontSize: 8, color: AXM.bone, letterSpacing: 1, marginTop: 2 },
  choiceArrow: { fontFamily: FONTS.gothic, fontSize: 18 },
});

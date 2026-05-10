import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AXM, FONTS } from '@/theme/axm';
import { EffectGlyph } from './EffectGlyph';

interface Effect {
  kind: string;
  name: string;
  duration?: number;
  intensity?: number;
  tint?: string;
}

interface EffectChipProps {
  effect: Effect;
  dim?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  poison: '#5a8a3a',
  bleed: AXM.blood,
  stun: AXM.sulfur,
  regen: '#5a8a3a',
  burn: AXM.rust,
  buff: AXM.sulfur,
  debuff: AXM.blood,
};

const TINT_MAP: Record<string, string> = {
  buff: AXM.buff,
  debuff: AXM.debuff,
  neutral: '#171410',
};

export function EffectChip({ effect, dim = false }: EffectChipProps) {
  const c = COLOR_MAP[effect.kind] || AXM.parchment;
  const bg = TINT_MAP[effect.tint || 'neutral'] || '#171410';

  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: c, opacity: dim ? 0.55 : 1 }]}>
      <EffectGlyph kind={effect.kind} size={12} color={c} />
      {effect.duration !== undefined && (
        <Text style={[styles.text, { color: c }]}>{effect.duration}</Text>
      )}
      {effect.intensity !== undefined && effect.intensity > 1 && (
        <Text style={[styles.text, { color: AXM.parchment, opacity: 0.65 }]}>×{effect.intensity}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingLeft: 4,
    paddingRight: 5,
    borderWidth: 1,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: 10,
  },
});

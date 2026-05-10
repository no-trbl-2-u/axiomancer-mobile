import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { AXM } from '@/theme/axm';
import { EffectGlyph } from './EffectGlyph';

interface ActionIconProps {
  kind: string;
  size?: number;
  color?: string;
}

export function ActionIcon({ kind, size = 28, color = AXM.parchment }: ActionIconProps) {
  switch (kind) {
    case 'sword':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M22 4 L28 4 L28 10 L13 25 L10 28 L4 28 L4 22 L7 19 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M11 21 L15 25" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'shield':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M16 3 L28 7 V17 C28 23 23 28 16 30 C9 28 4 23 4 17 V7 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M16 3 V30 M4 14 H28" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'arcane':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Circle cx={16} cy={16} r={11} stroke={color} strokeWidth={2} />
          <Path d="M16 4 L20 28 L4 13 H28 L12 28 Z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      );
    case 'bag':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M8 10 H24 L26 28 H6 Z" fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M11 10 V7 A5 5 0 0 1 21 7 V10" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'flee':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M6 28 L18 16 L10 8 L26 4 L22 20 L14 12" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M2 16 C 8 6 24 6 30 16 C 24 26 8 26 2 16 Z" fill={color} fillOpacity={0.1} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Circle cx={16} cy={16} r={5} fill={color} />
          <Path d="M16 22 L 14 28 M 18 26 L 17 30" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'crown':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M3 10 L8 22 H24 L29 10 L23 14 L16 6 L9 14 Z" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M3 26 H29" stroke={color} strokeWidth={2} />
          <Path d="M16 6 L 14 22 M 16 6 L 18 22" stroke={AXM.blood} strokeWidth={1.5} />
        </Svg>
      );
    case 'chest':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Rect x={4} y={12} width={24} height={16} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M4 12 C 4 6 28 6 28 12" stroke={color} strokeWidth={2} />
          <Rect x={14} y={16} width={4} height={6} fill={color} />
        </Svg>
      );
    case 'scroll':
      return (
        <Svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <Path d="M6 6 H26 V22 C26 25 24 27 21 27 H8 C5 27 3 25 3 22 V9 C3 7 5 5 6 6 Z" fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" />
          <Path d="M10 12 H22 M 10 16 H22 M 10 20 H18" stroke={color} strokeWidth={2} />
        </Svg>
      );
    case 'flame':
      return <EffectGlyph kind="burn" size={size} color={color} />;
    default:
      return null;
  }
}

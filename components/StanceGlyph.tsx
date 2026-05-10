import React from 'react';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';
import { AXM } from '@/theme/axm';

interface GlyphProps {
  size?: number;
  color?: string;
  stroke?: number;
}

export function GlyphHeart({ size = 40, color = AXM.parchment, stroke = 2.4 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M32 18 C 26 6, 10 8, 10 22 C 10 36, 32 52, 32 56 C 32 52, 54 36, 54 22 C 54 8, 38 6, 32 18 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={stroke} strokeLinejoin="round"
      />
      <Path d="M22 22 L 22 32 M 42 22 L 42 32 M 32 18 L 32 38" stroke={color} strokeWidth={stroke * 0.7} />
      <Path d="M28 14 L 26 8 M 36 14 L 38 8" stroke={color} strokeWidth={stroke} />
      <Path d="M16 30 L 22 36 M 18 36 L 22 40 M 42 36 L 48 30 M 42 40 L 46 36" stroke={color} strokeWidth={stroke * 0.6} opacity={0.55} />
    </Svg>
  );
}

export function GlyphBody({ size = 40, color = AXM.parchment, stroke = 2.4 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M14 30 C 14 24, 20 20, 26 20 L 44 20 C 48 20, 50 22, 50 26 L 50 38 C 50 46, 44 52, 36 52 L 26 52 C 18 52, 14 46, 14 40 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round"
      />
      <Path d="M22 26 L 22 22 M 30 26 L 30 22 M 38 26 L 38 22 M 46 26 L 46 22" stroke={color} strokeWidth={stroke} />
      <Path d="M22 34 L 50 34 M 22 40 L 50 40" stroke={color} strokeWidth={stroke * 0.7} />
      <Path d="M14 30 L 8 34 L 10 40 L 14 38" stroke={color} strokeWidth={stroke} />
      <Path d="M30 44 L 36 50 M 40 44 L 46 50" stroke={color} strokeWidth={stroke * 0.6} opacity={0.55} />
    </Svg>
  );
}

export function GlyphMind({ size = 40, color = AXM.parchment, stroke = 2.4 }: GlyphProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M14 28 C 14 16, 22 8, 32 8 C 42 8, 50 16, 50 28 L 50 38 C 50 42, 48 44, 44 44 L 44 50 C 44 52, 42 54, 40 54 L 24 54 C 22 54, 20 52, 20 50 L 20 44 C 16 44, 14 42, 14 38 Z"
        fill={color} fillOpacity={0.18} stroke={color} strokeWidth={stroke} strokeLinejoin="round"
      />
      <Ellipse cx={24} cy={30} rx={5} ry={6} fill="#0a0a0a" />
      <Ellipse cx={40} cy={30} rx={5} ry={6} fill="#0a0a0a" />
      <Path d="M30 38 L 32 42 L 34 38 Z" fill={color} />
      <Path d="M22 48 L 26 48 M 28 48 L 32 48 M 34 48 L 38 48 M 40 48 L 42 48" stroke={color} strokeWidth={stroke} />
      <Path d="M32 8 L 30 14 L 34 18 L 28 22 L 32 26" stroke={color} strokeWidth={stroke * 0.9} />
    </Svg>
  );
}

export function StanceGlyph({ kind, size = 40, color = AXM.parchment, stroke = 2.4 }: GlyphProps & { kind: string }) {
  if (kind === 'heart') return <GlyphHeart size={size} color={color} stroke={stroke} />;
  if (kind === 'body') return <GlyphBody size={size} color={color} stroke={stroke} />;
  return <GlyphMind size={size} color={color} stroke={stroke} />;
}

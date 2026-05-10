import React from 'react';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { AXM } from '@/theme/axm';

interface NodeMarkProps {
  kind?: 'completed' | 'locked' | 'current' | 'available';
  size?: number;
}

export function NodeMark({ kind = 'available', size = 28 }: NodeMarkProps) {
  if (kind === 'completed') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size} fill={AXM.bone} stroke={AXM.bone} strokeWidth={1}>
        <Path d="M8 12 C 8 6 12 4 16 4 C 20 4 24 6 24 12 V18 C 24 20 22 21 21 21 V25 H11 V21 C 10 21 8 20 8 18 Z" />
        <Circle cx={13} cy={14} r={2} fill="#0a0a0a" />
        <Circle cx={19} cy={14} r={2} fill="#0a0a0a" />
        <Path d="M14 24 H 18" stroke="#0a0a0a" strokeWidth={1} />
      </Svg>
    );
  }
  if (kind === 'locked') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size}>
        <Circle cx={16} cy={16} r={11} fill="#1a1814" stroke={AXM.ash} strokeWidth={2} strokeDasharray="3 3" />
        <Path d="M8 8 L 24 24 M 24 8 L 8 24" stroke={AXM.blood} strokeWidth={2.5} />
      </Svg>
    );
  }
  if (kind === 'current') {
    return (
      <Svg viewBox="0 0 32 32" width={size} height={size}>
        <Circle cx={16} cy={16} r={13} fill="none" stroke={AXM.sulfur} strokeWidth={2} />
        <Circle cx={16} cy={16} r={6} fill={AXM.sulfur} />
        <Circle cx={16} cy={16} r={2.5} fill="#0a0a0a" />
      </Svg>
    );
  }
  return (
    <Svg viewBox="0 0 32 32" width={size} height={size}>
      <Circle cx={16} cy={16} r={11} fill={AXM.bg} stroke={AXM.parchment} strokeWidth={2} />
      <Circle cx={16} cy={16} r={5} fill={AXM.parchment} />
    </Svg>
  );
}

export const AXM = {
  bg: '#0a0a0a',
  parchment: '#e8dfc8',
  blood: '#c0152a',
  sulfur: '#d4c026',
  rust: '#9e3a1a',
  debuff: '#1a0a2e',
  buff: '#2a1f00',
  bone: '#8a8273',
  ash: '#3a3530',
  panelBg: '#100d0a',
  deepBg: '#06050a',
} as const;

export const FONTS = {
  gothic: 'PirataOne_400Regular',
  serif: 'IMFellEnglish_400Regular',
  serifItalic: 'IMFellEnglish_400Regular_Italic',
  sans: 'BebasNeue_400Regular',
  mono: 'JetBrainsMono_400Regular',
};

export function tornEdgePath(width: number, height: number, jag = 6, seed = 1): string {
  const rnd = (i: number) => {
    const x = Math.sin(i * 9301 + seed * 49297) * 233280;
    return x - Math.floor(x);
  };
  const pts: [number, number][] = [];
  const stepX = 14, stepY = 14;
  for (let x = 0; x <= width; x += stepX) pts.push([x, rnd(x + 1) * jag]);
  for (let y = stepY; y <= height; y += stepY) pts.push([width - rnd(y + 100) * jag, y]);
  for (let x = width; x >= 0; x -= stepX) pts.push([x, height - rnd(x + 200) * jag]);
  for (let y = height - stepY; y > 0; y -= stepY) pts.push([rnd(y + 300) * jag, y]);
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ') + ' Z';
}

export function rnd(i: number, seed = 1) {
  const x = Math.sin(i * 9301 + seed * 49297) * 233280;
  return x - Math.floor(x);
}

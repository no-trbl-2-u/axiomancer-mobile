export const AXM = {
  bg: '#0a0a0a',
  parchment: '#e8dfc8',
  blood: '#c0152a',
  sulfur: '#d4c026',
  rust: '#9e3a1a',
  debuff: '#1a0a2e',
  buff: '#2a1f00',
  heal: '#5a8a3a',
  bone: '#8a8273',
  ash: '#3a3530',
  panelBg: '#100d0a',
  deepBg: '#06050a',
  dockBg: '#0d0a08',
  /**
   * Paper-doll silhouette fill. Warmer than `deepBg` (void) and
   * cooler than `dockBg` (panel) — sits visually between the two so
   * the hooded figure reads as carved out of the dock surface
   * rather than punched through it. Used in the Equipment Dock
   * `<PaperDoll>` (`app/(tabs)/inventory/index.tsx`).
   */
  silhouette: '#0a0807',
  /**
   * Selection / hover-emphasis fill — darkest-warm-yellow tinted
   * background used when a control is in a sulfur-bordered active
   * state (e.g. the Equipment Dock's slot-filter selection and the
   * "FITTING SLOT" banner). Pairs with a sulfur border + sulfur
   * accent text. From the design handoff
   * (`design/handoff-2026-05-16/project/screens/inventory.jsx:61,313`).
   */
  selectFill: '#1f1a0a',
  /**
   * Semi-transparent backdrop for overlays and modals.
   * Replaces 'rgba(0,0,0,0.4)' usage.
   */
  backdrop: 'rgba(6, 5, 10, 0.4)',
  /**
   * Heavy overlay background for modal backdrops.
   * Replaces 'rgba(6, 5, 10, 0.92)' usage.
   */
  overlay: 'rgba(6, 5, 10, 0.92)',
  /**
   * Subtle divider line using parchment with low opacity.
   * Replaces 'rgba(232, 223, 200, 0.12)' usage.
   */
  divider: 'rgba(232, 223, 200, 0.12)',
} as const;

export const FONTS = {
  gothic: 'PirataOne_400Regular',
  serif: 'IMFellEnglish_400Regular',
  serifItalic: 'IMFellEnglish_400Regular_Italic',
  sans: 'BebasNeue_400Regular',
  mono: 'JetBrainsMono_400Regular',
  // Fallback fonts for progressive loading
  sansFallback: 'System',
  monoFallback: 'Courier',
};

export const TYPE = {
  display: { fontFamily: FONTS.gothic, fontSize: 32, lineHeight: 38, letterSpacing: 0.5 },
  h1: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 30, letterSpacing: 0.3 },
  h2: { fontFamily: FONTS.serif, fontSize: 20, lineHeight: 26, letterSpacing: 0.2 },
  body: { fontFamily: FONTS.serif, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
  caption: { fontFamily: FONTS.sans, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
  mono: { fontFamily: FONTS.mono, fontSize: 14, lineHeight: 18, letterSpacing: 0 },
} as const;

// Dynamic type styles with font fallbacks for progressive loading
export function getTypeWithFallbacks(secondaryFontsLoaded: boolean) {
  return {
    display: { fontFamily: FONTS.gothic, fontSize: 32, lineHeight: 38, letterSpacing: 0.5 },
    h1: { fontFamily: FONTS.gothic, fontSize: 24, lineHeight: 30, letterSpacing: 0.3 },
    h2: { fontFamily: FONTS.serif, fontSize: 20, lineHeight: 26, letterSpacing: 0.2 },
    body: { fontFamily: FONTS.serif, fontSize: 16, lineHeight: 22, letterSpacing: 0 },
    caption: { fontFamily: secondaryFontsLoaded ? FONTS.sans : FONTS.sansFallback, fontSize: 14, lineHeight: 18, letterSpacing: 0.1 },
    mono: { fontFamily: secondaryFontsLoaded ? FONTS.mono : FONTS.monoFallback, fontSize: 14, lineHeight: 18, letterSpacing: 0 },
  } as const;
}

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

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

/**
 * Web scrollbar skin (visual-audit 2026-06). React Native Web renders the
 * platform's default scrollbar, which clashes with the gothic chrome. This
 * side-effect module injects a slim themed scrollbar (ash thumb on a void
 * track, sulfur on hover) once, on web only. Colours track the active theme
 * via `AXM`. No-op on native.
 */

import { Platform } from 'react-native';

import { AXM } from './axm';

if (Platform.OS === 'web') {
    try {
        if (typeof document !== 'undefined' && !document.getElementById('axm-scrollbar-skin')) {
            const style = document.createElement('style');
            style.id = 'axm-scrollbar-skin';
            style.textContent = `
                * { scrollbar-width: thin; scrollbar-color: ${AXM.ash} ${AXM.deepBg}; }
                ::-webkit-scrollbar { width: 9px; height: 9px; }
                ::-webkit-scrollbar-track { background: ${AXM.deepBg}; }
                ::-webkit-scrollbar-thumb {
                    background: ${AXM.ash};
                    border: 2px solid ${AXM.deepBg};
                }
                ::-webkit-scrollbar-thumb:hover { background: ${AXM.sulfur}; }
                ::-webkit-scrollbar-corner { background: ${AXM.deepBg}; }
            `;
            document.head.appendChild(style);
        }
    } catch {
        /* ignore — scrollbar styling is cosmetic */
    }
}

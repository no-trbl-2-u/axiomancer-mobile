/**
 * Unit tests for the fishing-village layout fixture.
 * 
 * Validates the 25-node structure after Phase 81a reconciliation
 * with engine source. Ensures all nodes are present with correct
 * connections and proper visual positioning within the 360x400 viewBox.
 */

import { describe, it, expect } from '@jest/globals';
import { fishingVillageLayout } from '../fishing-village.layout';

describe('fishingVillageLayout: structure validation', () => {
    it('contains exactly 25 nodes (fv-1..fv-25)', () => {
        expect(fishingVillageLayout.nodes).toHaveLength(25);
        
        const ids = fishingVillageLayout.nodes.map(n => n.id);
        const expectedIds = Array.from({ length: 25 }, (_, i) => `fv-${i + 1}`);
        
        for (const expectedId of expectedIds) {
            expect(ids).toContain(expectedId);
        }
    });

    it('has correct metadata matching the expanded scope', () => {
        expect(fishingVillageLayout.mapId).toBe('fishing-village');
        expect(fishingVillageLayout.continent).toBe('CONTINENT · COASTAL');
        expect(fishingVillageLayout.region).toBe('Fishing Village');
        expect(fishingVillageLayout.regionProgress).toBe('Map i of ii · 24 paths remain');
    });

    it('all nodes have required properties with correct types', () => {
        for (const node of fishingVillageLayout.nodes) {
            expect(typeof node.id).toBe('string');
            expect(typeof node.x).toBe('number');
            expect(typeof node.y).toBe('number');
            expect(typeof node.label).toBe('string');
            expect(typeof node.type).toBe('string');
            expect(Array.isArray(node.connectedNodes)).toBe(true);
            expect(typeof node.description).toBe('string');
            
            // Validate position is within 360x400 viewBox
            expect(node.x).toBeGreaterThanOrEqual(0);
            expect(node.x).toBeLessThanOrEqual(360);
            expect(node.y).toBeGreaterThanOrEqual(0);
            expect(node.y).toBeLessThanOrEqual(400);
        }
    });
});

describe('fishingVillageLayout: spine nodes (fv-1..fv-10)', () => {
    function getNode(id: string) {
        return fishingVillageLayout.nodes.find(n => n.id === id);
    }

    it('fv-1 connects to fv-2 and fv-11 (harbor district entry)', () => {
        const node = getNode('fv-1');
        expect(node?.connectedNodes).toEqual(['fv-2', 'fv-11']);
    });

    it('fv-2 connects to fv-3 and fv-12 (harbor district)', () => {
        const node = getNode('fv-2');
        expect(node?.connectedNodes).toEqual(['fv-3', 'fv-12']);
    });

    it('fv-3 connects to fv-4, fv-13, and fv-16 (harbor + inland entries)', () => {
        const node = getNode('fv-3');
        expect(node?.connectedNodes).toEqual(['fv-4', 'fv-13', 'fv-16']);
    });

    it('fv-4 connects to fv-5 and fv-17 (inland district)', () => {
        const node = getNode('fv-4');
        expect(node?.connectedNodes).toEqual(['fv-5', 'fv-17']);
    });

    it('fv-5 connects to fv-6 and fv-18 (inland district)', () => {
        const node = getNode('fv-5');
        expect(node?.connectedNodes).toEqual(['fv-6', 'fv-18']);
    });

    it('fv-6 connects only to fv-7 (linear spine)', () => {
        const node = getNode('fv-6');
        expect(node?.connectedNodes).toEqual(['fv-7']);
    });

    it('fv-7 connects to fv-8 and fv-21 (cliff district entry)', () => {
        const node = getNode('fv-7');
        expect(node?.connectedNodes).toEqual(['fv-8', 'fv-21']);
    });

    it('fv-8 connects to fv-9 and fv-22 (cliff district)', () => {
        const node = getNode('fv-8');
        expect(node?.connectedNodes).toEqual(['fv-9', 'fv-22']);
    });

    it('fv-9 connects only to fv-10 (linear spine)', () => {
        const node = getNode('fv-9');
        expect(node?.connectedNodes).toEqual(['fv-10']);
    });

    it('fv-10 is terminal (no connections)', () => {
        const node = getNode('fv-10');
        expect(node?.connectedNodes).toEqual([]);
    });
});

describe('fishingVillageLayout: harbor district (fv-11..fv-15)', () => {
    function getNode(id: string) {
        return fishingVillageLayout.nodes.find(n => n.id === id);
    }

    it('fv-11 connects to spine fv-1 and internal fv-12, fv-14', () => {
        const node = getNode('fv-11');
        expect(node?.connectedNodes).toEqual(['fv-1', 'fv-12', 'fv-14']);
    });

    it('fv-12 connects to spine fv-2 and internal fv-11, fv-13', () => {
        const node = getNode('fv-12');
        expect(node?.connectedNodes).toEqual(['fv-2', 'fv-11', 'fv-13']);
    });

    it('fv-13 connects to spine fv-3 and internal fv-12', () => {
        const node = getNode('fv-13');
        expect(node?.connectedNodes).toEqual(['fv-3', 'fv-12']);
    });

    it('fv-14 connects to internal fv-11 and fv-15', () => {
        const node = getNode('fv-14');
        expect(node?.connectedNodes).toEqual(['fv-11', 'fv-15']);
    });

    it('fv-15 is a dead-end connected only to fv-14', () => {
        const node = getNode('fv-15');
        expect(node?.connectedNodes).toEqual(['fv-14']);
    });
});

describe('fishingVillageLayout: inland district (fv-16..fv-20)', () => {
    function getNode(id: string) {
        return fishingVillageLayout.nodes.find(n => n.id === id);
    }

    it('fv-16 connects to spine fv-3 and internal fv-17', () => {
        const node = getNode('fv-16');
        expect(node?.connectedNodes).toEqual(['fv-3', 'fv-17']);
    });

    it('fv-17 is the crossroads connecting spine fv-4 and internal fv-16, fv-18, fv-19', () => {
        const node = getNode('fv-17');
        expect(node?.connectedNodes).toEqual(['fv-4', 'fv-16', 'fv-18', 'fv-19']);
    });

    it('fv-18 connects to spine fv-5 and internal fv-17, fv-19', () => {
        const node = getNode('fv-18');
        expect(node?.connectedNodes).toEqual(['fv-5', 'fv-17', 'fv-19']);
    });

    it('fv-19 connects to internal fv-17, fv-18, fv-20', () => {
        const node = getNode('fv-19');
        expect(node?.connectedNodes).toEqual(['fv-17', 'fv-18', 'fv-20']);
    });

    it('fv-20 is a dead-end connected only to fv-19', () => {
        const node = getNode('fv-20');
        expect(node?.connectedNodes).toEqual(['fv-19']);
    });
});

describe('fishingVillageLayout: cliff district (fv-21..fv-25)', () => {
    function getNode(id: string) {
        return fishingVillageLayout.nodes.find(n => n.id === id);
    }

    it('fv-21 connects to spine fv-7 and internal fv-22, fv-24', () => {
        const node = getNode('fv-21');
        expect(node?.connectedNodes).toEqual(['fv-7', 'fv-22', 'fv-24']);
    });

    it('fv-22 connects to spine fv-8 and internal fv-21, fv-23', () => {
        const node = getNode('fv-22');
        expect(node?.connectedNodes).toEqual(['fv-8', 'fv-21', 'fv-23']);
    });

    it('fv-23 connects to internal fv-22, fv-24', () => {
        const node = getNode('fv-23');
        expect(node?.connectedNodes).toEqual(['fv-22', 'fv-24']);
    });

    it('fv-24 connects to internal fv-21, fv-23, fv-25', () => {
        const node = getNode('fv-24');
        expect(node?.connectedNodes).toEqual(['fv-21', 'fv-23', 'fv-25']);
    });

    it('fv-25 is a dead-end connected only to fv-24', () => {
        const node = getNode('fv-25');
        expect(node?.connectedNodes).toEqual(['fv-24']);
    });
});

describe('fishingVillageLayout: visual distribution validation', () => {
    it('spine nodes are distributed vertically', () => {
        const spineNodes = fishingVillageLayout.nodes.filter(n => 
            /^fv-([1-9]|10)$/.test(n.id)
        );
        
        // Sort by Y position (top to bottom)
        const sorted = [...spineNodes].sort((a, b) => b.y - a.y);
        
        // Verify they maintain the expected ID order from fv-1 (highest Y) to fv-10 (lowest Y)
        expect(sorted[0].id).toBe('fv-1');  // highest Y value (bottom of screen)
        expect(sorted[sorted.length - 1].id).toBe('fv-10');  // lowest Y value (top of screen)
    });

    it('district nodes are positioned laterally from the spine', () => {
        const harborNodes = fishingVillageLayout.nodes.filter(n => 
            ['fv-11', 'fv-12', 'fv-13', 'fv-14', 'fv-15'].includes(n.id)
        );
        const inlandNodes = fishingVillageLayout.nodes.filter(n => 
            ['fv-16', 'fv-17', 'fv-18', 'fv-19', 'fv-20'].includes(n.id)
        );
        const cliffNodes = fishingVillageLayout.nodes.filter(n => 
            ['fv-21', 'fv-22', 'fv-23', 'fv-24', 'fv-25'].includes(n.id)
        );

        // All districts should have valid coordinates
        expect(harborNodes).not.toHaveLength(0);
        expect(inlandNodes).not.toHaveLength(0);
        expect(cliffNodes).not.toHaveLength(0);

        // Validate X positioning distribution (districts spread horizontally)
        const allX = fishingVillageLayout.nodes.map(n => n.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        expect(maxX - minX).toBeGreaterThan(100); // Nodes spread across viewBox width
    });

    it('no two nodes occupy the exact same position', () => {
        const positions = fishingVillageLayout.nodes.map(n => `${n.x},${n.y}`);
        const uniquePositions = new Set(positions);
        
        expect(uniquePositions.size).toBe(fishingVillageLayout.nodes.length);
    });
});

describe('fishingVillageLayout: regression prevention', () => {
    it('removes old cross-spine shortcuts (fv-2→fv-4, fv-5→fv-8)', () => {
        const fv2 = fishingVillageLayout.nodes.find(n => n.id === 'fv-2');
        const fv5 = fishingVillageLayout.nodes.find(n => n.id === 'fv-5');
        
        // These were mobile-specific shortcuts that conflicted with engine source
        expect(fv2?.connectedNodes).not.toContain('fv-4');
        expect(fv5?.connectedNodes).not.toContain('fv-8');
    });

    it('maintains linear spine progression where specified', () => {
        // These spine connections should be strictly linear (no branches)
        const fv6 = fishingVillageLayout.nodes.find(n => n.id === 'fv-6');
        const fv9 = fishingVillageLayout.nodes.find(n => n.id === 'fv-9');
        const fv10 = fishingVillageLayout.nodes.find(n => n.id === 'fv-10');
        
        expect(fv6?.connectedNodes).toHaveLength(1);
        expect(fv9?.connectedNodes).toHaveLength(1);
        expect(fv10?.connectedNodes).toHaveLength(0);  // terminal
    });

    it('all connectedNodes references point to existing node IDs', () => {
        const allIds = new Set(fishingVillageLayout.nodes.map(n => n.id));
        
        for (const node of fishingVillageLayout.nodes) {
            for (const connectedId of node.connectedNodes ?? []) {
                expect(allIds.has(connectedId)).toBe(true);
                if (!allIds.has(connectedId)) {
                    throw new Error(`Node ${node.id} references non-existent node ${connectedId}`);
                }
            }
        }
    });
});
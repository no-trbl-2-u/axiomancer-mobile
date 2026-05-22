/**
 * Hermetic component tests — PlaceholderIllustration (the
 * slug-keyed SVG placeholder for non-encounter event kinds).
 *
 * The component is a single Svg with a deterministic background
 * (60-segment Line strip) plus one of seven kind-specific
 * groups rendered conditionally on `slug`. Per the file's
 * header, these are deliberate placeholders until the asset-
 * swap workflow ships real art. The branches still need pinning
 * so a refactor can't silently drop a kind's visual.
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Line, Path } from 'react-native-svg';

import { PlaceholderIllustration } from '@/components/event/PlaceholderIllustration';

describe('PlaceholderIllustration: always-on background', () => {
    it('renders the 60-segment Line grid regardless of slug', () => {
        // Cover the grid invariant across two arbitrary slugs to
        // confirm it's not conditional on any branch.
        const treeRest = render(<PlaceholderIllustration slug="rest" />);
        const treeHazard = render(<PlaceholderIllustration slug="hazard" />);
        expect(treeRest.UNSAFE_getAllByType(Line)).toHaveLength(60);
        expect(treeHazard.UNSAFE_getAllByType(Line)).toHaveLength(60);
    });
});

describe('PlaceholderIllustration: kind-specific branches', () => {
    it('rest: emits exactly 2 Paths (tent triangle + smile)', () => {
        const tree = render(<PlaceholderIllustration slug="rest" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });

    it('gathering: emits 5 stalk Paths (one per of 5 stalks)', () => {
        const tree = render(<PlaceholderIllustration slug="gathering" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(5);
    });

    it('loot-cache: emits the chest body + lid line (2 Paths)', () => {
        const tree = render(<PlaceholderIllustration slug="loot-cache" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });

    it('interaction-generic: emits the figure body Path (1 Path)', () => {
        const tree = render(<PlaceholderIllustration slug="interaction-generic" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('village: emits 4 huts × 2 Paths each (8 Paths total)', () => {
        const tree = render(<PlaceholderIllustration slug="village" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(8);
    });

    it('cutscene: emits the central crosshair Path (1 Path)', () => {
        const tree = render(<PlaceholderIllustration slug="cutscene" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(1);
    });

    it('hazard: emits the warning triangle + exclamation (2 Paths)', () => {
        const tree = render(<PlaceholderIllustration slug="hazard" />);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });
});

describe('PlaceholderIllustration: encounter / boss slugs render only the background', () => {
    it('renders only the background grid for the encounter slug (real art ships via EncounterIllustration)', () => {
        // The dispatcher in EventArt routes encounter/boss away from
        // this placeholder. If a slug ever falls through here for an
        // illustration that has its own component, we want to know
        // the placeholder is intentionally bare (no second branch
        // accidentally lights up).
        const tree = render(<PlaceholderIllustration slug="encounter" />);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });

    it('renders only the background grid for the boss slug', () => {
        const tree = render(<PlaceholderIllustration slug="boss" />);
        expect(tree.UNSAFE_queryAllByType(Path)).toHaveLength(0);
    });
});

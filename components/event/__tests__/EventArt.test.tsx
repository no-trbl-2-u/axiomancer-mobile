/**
 * Hermetic component tests — EventArt slug→illustration dispatcher.
 *
 * Three-branch dispatch: `'encounter' → EncounterIllustration`,
 * `'boss' → BossIllustration`, everything else →
 * `PlaceholderIllustration` (slug forwarded). The PlaceholderIllustration
 * test already pins the placeholder branches; this test pins the
 * dispatch contract so a future refactor can't silently re-route an
 * encounter slug to the placeholder (or vice-versa).
 */

import { describe, expect, it } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Line, Path } from 'react-native-svg';

import { EventArt } from '@/components/event/EventArt';

describe('EventArt: slug dispatch', () => {
    it("routes 'encounter' to EncounterIllustration (no 60-segment placeholder grid)", () => {
        const tree = render(<EventArt slug="encounter" />);
        // EncounterIllustration has its own SVG; the placeholder's
        // 60-segment Line grid is absent.
        expect(tree.UNSAFE_queryAllByType(Line)).not.toHaveLength(60);
        // EncounterIllustration emits at least one Path.
        expect(tree.UNSAFE_getAllByType(Path).length).toBeGreaterThan(0);
    });

    it("routes 'boss' to BossIllustration (no 60-segment placeholder grid)", () => {
        const tree = render(<EventArt slug="boss" />);
        expect(tree.UNSAFE_queryAllByType(Line)).not.toHaveLength(60);
        expect(tree.UNSAFE_getAllByType(Path).length).toBeGreaterThan(0);
    });

    it("routes 'rest' to PlaceholderIllustration (60-segment grid + 2 placeholder Paths)", () => {
        const tree = render(<EventArt slug="rest" />);
        // PlaceholderIllustration always renders the 60-segment grid.
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
        // The `rest` placeholder branch emits 2 Paths (tent + smile).
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });

    it("routes 'gathering' to PlaceholderIllustration (forwards the slug — 5 stalk Paths)", () => {
        const tree = render(<EventArt slug="gathering" />);
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
        // The `gathering` placeholder branch emits 5 stalk Paths —
        // confirms EventArt forwards the slug, not a fallback default.
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(5);
    });

    it("routes 'hazard' to PlaceholderIllustration (forwards the slug — 2 warning Paths)", () => {
        const tree = render(<EventArt slug="hazard" />);
        expect(tree.UNSAFE_getAllByType(Line)).toHaveLength(60);
        expect(tree.UNSAFE_getAllByType(Path)).toHaveLength(2);
    });
});

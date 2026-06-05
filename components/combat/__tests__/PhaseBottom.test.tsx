/**
 * PhaseBottom component test — Phase 95.
 *
 * Pins the disabled ITEM button tooltip behavior: when the ITEM action
 * is disabled, tapping it should render a TooltipTarget that shows
 * "ITEM UNAVAILABLE" tooltip content. Enabled actions and non-ITEM
 * disabled actions keep their existing TouchableOpacity behavior.
 */

import { describe, expect, it, jest } from '@jest/globals';
import { render } from '@testing-library/react-native';
import React from 'react';

import { withAllProviders } from '@/test-utils/withAllProviders';
import { PhaseBottom } from '@/components/combat/PhaseBottom';
import type { CombatViewModel, ActionOption } from '@/state/presenters/combat.engine';

// Mock minimal combat VM with focus on action phase
const createMockCombatVM = (actionOptions: ActionOption[]): CombatViewModel => ({
    phase: 'choosing_action' as const,
    phaseIndex: 1,
    phaseOrder: ['choosing_stance', 'choosing_action', 'choosing_skill', 'resolving'],
    phaseHeader: 'CHOOSE THY ACTION',
    phaseStack: [
        {
            key: 'choosing_stance',
            state: 'past',
            visible: true,
            label: 'I · STAND',
            summary: 'BODY',
        },
        {
            key: 'choosing_action',
            state: 'current',
            visible: true,
            label: 'II · DO',
            summary: '',
        },
    ],
    round: 1,
    enemy: {
        name: 'Test Enemy',
        tier: '',
        hp: 10,
        hpMax: 10,
        hpRatio: 1,
        lastStance: null,
        mindMarks: 0,
        effects: [],
        flavor: '',
    },
    player: {
        hp: 10,
        hpMax: 10,
        hpRatio: 1,
        totalResources: 5,
        maxResources: 5,
        resourceRatio: 1,
        effects: [],
    },
    stancePicker: {
        options: [],
        selected: null,
        canConfirm: false,
    },
    actionPicker: {
        options: actionOptions,
        fleeAvailable: false,
        fleeMessage: '',
        fleeHint: '',
        itemMessage: '',
    },
    skillPicker: {
        skills: [],
        availableCount: 0,
        totalCount: 0,
    },
    resolve: {
        playerStance: 'body',
        enemyStance: 'mind',
        advantageLabel: 'NEUTRAL',
        advantageKind: 'neutral',
        playerRoll: 10,
        enemyRoll: 8,
        outcome: 'damage',
        primaryText: '–2',
        message: 'Body stance beats mind',
        header: 'RESOLUTION',
        nextActionLabel: 'CONTINUE',
    },
    log: [],
    logEmptyMessage: 'the battle begins...',
    a11y: {
        stanceHeart: 'Heart stance',
        stanceBody: 'Body stance', 
        stanceMind: 'Mind stance',
        actionAttack: 'Attack action',
        actionDefend: 'Defend action',
        actionSkill: 'Skill action',
        actionItem: 'Item action',
        playerHp: 'Player health',
        playerMana: 'Player mana',
        enemyHp: 'Enemy health',
        phaseHeader: 'Phase header',
        roundInfo: 'Round info',
    },
    roundToken: 'i vs i',
    friendshipCounter: 0,
    friendshipCounterMax: 10,
    isInCombat: true,
    hud: {
        hpPercent: 1,
        manaPercent: 1,
        effects: [],
    },
    crucibleTokens: [
        { key: 'body', glyph: '◐', short: 'BOD', count: 2, color: '#b53e3e' },
        { key: 'heart', glyph: '◑', short: 'HRT', count: 1, color: '#e4b429' },
        { key: 'mind', glyph: '◒', short: 'MND', count: 0, color: '#9d5a3c' },
        { key: 'fallacy', glyph: '◓', short: 'FAL', count: 1, color: '#9a8d75' },
        { key: 'paradox', glyph: '◉', short: 'PRX', count: 0, color: '#e4dcc6' },
    ],
    loadingMessage: 'loading...',
    mercyChoice: {
        isActive: false,
        enemyName: 'TEST ENEMY',
        spareLabel: 'SPARE',
        spareHint: 'preserve test enemy · path of mercy',
        exploitLabel: 'EXPLOIT',
        exploitHint: 'seize the opening · guaranteed critical',
        a11y: {
            spare: 'Spare TEST ENEMY, choosing mercy and consequence',
            exploit: 'Exploit the opening for a guaranteed critical attack against TEST ENEMY',
        },
    },
});

const mockActionOptions: ActionOption[] = [
    {
        key: 'attack',
        label: 'ATTACK',
        hint: 'STRIKE WITH WEAPON',
        iconKind: 'sword',
        accentKind: 'blood',
        enabled: true,
    },
    {
        key: 'item',
        label: 'ITEM', 
        hint: 'USE A CONSUMABLE',
        iconKind: 'bag',
        accentKind: 'rust',
        enabled: false, // This is the disabled ITEM button
    },
];

const mockProps = {
    onPickStance: jest.fn(),
    onPickAction: jest.fn(),
    onPickSkill: jest.fn(),
    onGoBackToPhase: jest.fn(),
    onFlee: jest.fn(),
    onContinue: jest.fn(),
    onLeave: jest.fn(),
};

describe('PhaseBottom: Phase 109 stance card layout shrink-to-fit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders stance cards without clipping when all three cards are present', () => {
        const stanceOptions = [
            { 
                key: 'heart' as const,
                label: 'HEART',
                gloss: 'Fire of the will. Charm and fervour.',
                counters: 'BODY',
                weakTo: 'MIND',
                advantage: 'neutral' as const,
                derived: { attack: 11, skill: 9, defense: 6 }
            },
            {
                key: 'body' as const,
                label: 'BODY',
                gloss: 'Meat & marrow. Bones that endure.',
                counters: 'MIND',
                weakTo: 'HEART',
                advantage: 'neutral' as const,
                derived: { attack: 13, skill: 7, defense: 10 }
            },
            {
                key: 'mind' as const,
                label: 'MIND',
                gloss: 'Cold reason. Patient cruelty.',
                counters: 'HEART',
                weakTo: 'BODY',
                advantage: 'neutral' as const,
                derived: { attack: 8, skill: 14, defense: 8 }
            }
        ];

        const vmWithStancePhase: CombatViewModel = {
            ...createMockCombatVM([]),
            phase: 'choosing_stance',
            phaseIndex: 0,
            phaseStack: [
                {
                    key: 'choosing_stance',
                    state: 'current',
                    visible: true,
                    label: 'I · STAND',
                    summary: '',
                }
            ],
            stancePicker: {
                options: stanceOptions,
                selected: null,
                canConfirm: false,
            }
        };

        const { tree } = withAllProviders(
            <PhaseBottom vm={vmWithStancePhase} {...mockProps} />
        );

        const rendered = render(tree);
        
        // All three stance cards should be rendered
        expect(rendered.getByText('HEART')).toBeTruthy();
        expect(rendered.getByText('BODY')).toBeTruthy();
        expect(rendered.getByText('MIND')).toBeTruthy();
        
        // Mind card should contain its relationship text without truncation
        expect(rendered.getByText('Cold reason. Patient cruelty.')).toBeTruthy();
        expect(rendered.getByText('HEART', { exact: false })).toBeTruthy(); // In "BEATS HEART"
        expect(rendered.getByText('BODY', { exact: false })).toBeTruthy(); // In "WEAK BODY"
    });

    it('applies compact styling to stance cards for better fit', () => {
        const stanceOptions = [
            { 
                key: 'mind' as const,
                label: 'MIND',
                gloss: 'Cold reason. Patient cruelty.',
                counters: 'HEART',
                weakTo: 'BODY',
                advantage: 'neutral' as const,
                derived: { attack: 8, skill: 14, defense: 8 }
            }
        ];

        const vmWithStancePhase: CombatViewModel = {
            ...createMockCombatVM([]),
            phase: 'choosing_stance',
            phaseIndex: 0,
            phaseStack: [
                {
                    key: 'choosing_stance',
                    state: 'current',
                    visible: true,
                    label: 'I · STAND',
                    summary: '',
                }
            ],
            stancePicker: {
                options: stanceOptions,
                selected: null,
                canConfirm: false,
            }
        };

        const { tree } = withAllProviders(
            <PhaseBottom vm={vmWithStancePhase} {...mockProps} />
        );

        const rendered = render(tree);
        
        // Mind stance card should render with proper text limiting
        const mindStanceText = rendered.getByText('MIND');
        expect(mindStanceText.props.numberOfLines).toBe(1);
        expect(mindStanceText.props.adjustsFontSizeToFit).toBe(true);
        
        const glossText = rendered.getByText('Cold reason. Patient cruelty.');
        expect(glossText.props.numberOfLines).toBe(2);
    });
});

describe('PhaseBottom: Phase 95 disabled ITEM tooltip', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders disabled ITEM button with tooltip target', () => {
        const vm = createMockCombatVM(mockActionOptions);
        const { tree } = withAllProviders(
            <PhaseBottom vm={vm} {...mockProps} />
        );

        const rendered = render(tree);
        
        // Should find the disabled ITEM button with tooltip test ID
        const tooltipTarget = rendered.getByTestId('combat-action-item-disabled-tooltip');
        expect(tooltipTarget).toBeTruthy();
    });

    it('renders enabled actions as regular TouchableOpacity', () => {
        const vm = createMockCombatVM(mockActionOptions);
        const { tree } = withAllProviders(
            <PhaseBottom vm={vm} {...mockProps} />
        );

        const rendered = render(tree);

        // The ATTACK button should not have a disabled tooltip
        expect(rendered.queryByTestId('combat-action-attack-disabled-tooltip')).toBeNull();
    });

    it('does not add tooltip to other disabled actions (not ITEM)', () => {
        const actionsWithDisabledDefend: ActionOption[] = [
            ...mockActionOptions,
            {
                key: 'defend',
                label: 'DEFEND',
                hint: 'REDUCE NEXT HARM',
                iconKind: 'shield',
                accentKind: 'parchment',
                enabled: false, // Disabled but not ITEM
            },
        ];
        
        const vm = createMockCombatVM(actionsWithDisabledDefend);
        const { tree } = withAllProviders(
            <PhaseBottom vm={vm} {...mockProps} />
        );

        const rendered = render(tree);

        // DEFEND disabled button should not have tooltip
        expect(rendered.queryByTestId('combat-action-defend-disabled-tooltip')).toBeNull();
        
        // But ITEM should still have tooltip
        expect(rendered.getByTestId('combat-action-item-disabled-tooltip')).toBeTruthy();
    });

    it('does not add tooltip when ITEM action is enabled', () => {
        const actionsWithEnabledItem: ActionOption[] = [
            {
                key: 'item',
                label: 'ITEM',
                hint: 'USE A CONSUMABLE',
                iconKind: 'bag', 
                accentKind: 'rust',
                enabled: true, // Enabled ITEM
            },
        ];

        const vm = createMockCombatVM(actionsWithEnabledItem);
        const { tree } = withAllProviders(
            <PhaseBottom vm={vm} {...mockProps} />
        );

        const rendered = render(tree);

        // No tooltip when ITEM is enabled
        expect(rendered.queryByTestId('combat-action-item-disabled-tooltip')).toBeNull();
    });
});
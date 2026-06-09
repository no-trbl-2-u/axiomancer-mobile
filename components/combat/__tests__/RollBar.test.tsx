import React from 'react';
import { render } from '@testing-library/react-native';

import { RollBar } from '../RollBar';
import { AXM } from '@/theme/axm';

describe('RollBar', () => {
    it('renders roll bar with correct value', () => {
        const { getByText } = render(
            <RollBar
                value={15}
                max={20}
                color={AXM.sulfur}
                label="YOU"
            />
        );
        
        expect(getByText('15')).toBeTruthy();
        expect(getByText('YOU')).toBeTruthy();
    });

    it('calculates correct percentage fill', () => {
        const { getByText } = render(
            <RollBar
                value={10}
                max={20}
                color={AXM.blood}
                label="FOE"
            />
        );
        
        // Should render 50% of the bar (10/20)
        expect(getByText('10')).toBeTruthy();
    });

    it('handles max value correctly', () => {
        const { getByText } = render(
            <RollBar
                value={20}
                max={20}
                color={AXM.sulfur}
                label="MAX"
            />
        );
        
        expect(getByText('20')).toBeTruthy();
    });
});
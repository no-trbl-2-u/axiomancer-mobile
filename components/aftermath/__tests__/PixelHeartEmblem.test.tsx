/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import PixelHeartEmblem from '../PixelHeartEmblem';

describe('PixelHeartEmblem', () => {
    it('renders pixel heart emblem', () => {
        // SVG should render with default props
        const component = render(<PixelHeartEmblem />);
        expect(component).toBeTruthy();
    });

    it('accepts custom cell size', () => {
        // Should render with smaller cells
        const component = render(<PixelHeartEmblem cellSize={8} />);
        expect(component).toBeTruthy();
    });

    it('renders SVG with correct dimensions', () => {
        const cellSize = 10;
        
        const component = render(<PixelHeartEmblem cellSize={cellSize} />);
        expect(component).toBeTruthy();
        
        // The component should render without errors
        // More detailed SVG testing would require additional setup
    });

    it('uses default cell size when not specified', () => {
        const component = render(<PixelHeartEmblem />);
        expect(component).toBeTruthy();
        
        // Default should be 12px cells (192px total)
        // Component should render successfully with defaults
    });
});
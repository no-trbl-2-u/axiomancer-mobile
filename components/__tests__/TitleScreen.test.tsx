/**
 * Hermetic tests for the TitleScreen component.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TitleScreen } from '../TitleScreen';
import { createAppStore } from '@/state/store';
import { GameStoreProvider } from '@/state/GameStoreProvider';
import { createMemoryAdapter } from '@/test-utils/memoryAdapter';

// Mock the debug seed action since we're not testing the actual seeding behavior
jest.mock('@/state/actions', () => ({
  ...jest.requireActual('@/state/actions'),
  createAppActions: () => ({
    debugSeed: jest.fn(),
  }),
}));

describe('TitleScreen', () => {
  const TestWrapper = ({ children }: { children: React.ReactNode }) => {
    const store = createAppStore({ adapter: createMemoryAdapter() });
    return <GameStoreProvider store={store}>{children}</GameStoreProvider>;
  };

  it('renders title and flavor text', () => {
    const mockOnContinue = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    expect(getByText('AXIOMANCER')).toBeTruthy();
    expect(getByText('MOBILE')).toBeTruthy();
    expect(getByText(/You are a PILGRIM/)).toBeTruthy();
    expect(getByText(/fishing village/)).toBeTruthy();
  });

  it('renders begin journey button with accessibility', () => {
    const mockOnContinue = jest.fn();
    const { getByRole, getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Begin your journey');
    expect(getByText('BEGIN JOURNEY')).toBeTruthy();
  });

  it('calls onContinue when begin journey button is pressed', () => {
    const mockOnContinue = jest.fn();
    const { getByRole } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const button = getByRole('button');
    fireEvent.press(button);
    
    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('applies correct styling and theme colors', () => {
    const mockOnContinue = jest.fn();
    const { getByText } = render(
      <TestWrapper>
        <TitleScreen onContinue={mockOnContinue} />
      </TestWrapper>
    );

    const title = getByText('AXIOMANCER');
    expect(title.props.style).toMatchObject({
      fontFamily: expect.any(String),
      fontSize: 48,
      color: expect.any(String),
    });
  });
});
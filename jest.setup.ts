import '@testing-library/jest-native/extend-expect';

jest.mock('expo-font', () => ({
    useFonts: () => [true, null],
    isLoaded: () => true,
}));

jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: () => Promise.resolve(),
    hideAsync: () => Promise.resolve(),
    setOptions: () => undefined,
}));

jest.mock('expo-haptics', () => ({
    impactAsync: () => Promise.resolve(),
    notificationAsync: () => Promise.resolve(),
    selectionAsync: () => Promise.resolve(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
    NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

require('react-native-reanimated/mock');

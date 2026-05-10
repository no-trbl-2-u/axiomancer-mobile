/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['./jest.setup.ts'],
    transformIgnorePatterns: [
        'node_modules/(?!(' +
            'axiomancer-mechanics|' +
            'expo|expo-.*|@expo/.*|' +
            'react-native|react-native-.*|@react-native/.*|' +
            'react-native-reanimated|' +
            '@react-navigation/.*' +
            ')/)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};

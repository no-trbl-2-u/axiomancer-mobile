// TODO: Replace jest.spyOn(Math, 'random') stubs with the engine's seedable RNG
// once axiomancer-mechanics ships it (engine Spec 11).

/**
 * Stubs Math.random to alternate between two values on successive calls.
 * Useful for exercising both branches of a coin-flip (hit / miss, etc.)
 */
export function mockAlternatingRng(low = 0.1, high = 0.9): jest.SpyInstance {
    let call = 0;
    return jest.spyOn(Math, 'random').mockImplementation(() => {
        return call++ % 2 === 0 ? low : high;
    });
}

/**
 * Stubs Math.random to always return the same value.
 */
export function mockFixedRng(value: number): jest.SpyInstance {
    return jest.spyOn(Math, 'random').mockReturnValue(value);
}

/**
 * Stubs Math.random to return values from a predetermined sequence.
 * Wraps around once the sequence is exhausted.
 */
export function mockSequentialRng(...values: number[]): jest.SpyInstance {
    let i = 0;
    return jest.spyOn(Math, 'random').mockImplementation(() => {
        return values[i++ % values.length];
    });
}

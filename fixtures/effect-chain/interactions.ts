// fixtures/effect-chain/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

/** One user write + two effect paints (A, then B, then C). */
export async function driveChain(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('bumpA');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame(); // A (+ effect_B scheduled)
        await harness.flushFrame(); // B (+ effect_C scheduled)
        await harness.flushFrame(); // C
    }
}

export async function driveNoise(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('bumpNoise');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}
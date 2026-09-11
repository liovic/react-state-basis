// fixtures/high-frequency/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function driveFrames(harness: FixtureHarness, frames = 20) {
    for (let i = 0; i < frames; i++) {
        await act(async () => {
            await harness.flushFrame();
        });
    }
}

export async function driveClicks(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('click');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}
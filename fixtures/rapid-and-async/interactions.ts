// fixtures/rapid-and-async/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function drive(harness: FixtureHarness, label: string, times = 5) {
    const button = screen.getByText(label);
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}

export async function driveTimeout(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('kick');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.advance(500);
        await harness.flushFrame();
    }
}

export async function drivePromise(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('kick');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
            await Promise.resolve();
        });
        await harness.flushFrame();
    }
}
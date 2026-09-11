// fixtures/intentional-sync/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function driveToggle(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('toggle');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}

export async function driveTheme(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('theme');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}

export async function driveToggleSplit(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('toggle');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.advance(1);
        await harness.flushFrame();
    }
}
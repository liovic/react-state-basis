// fixtures/context-mirror/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function driveTheme(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('toggleTheme');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.flushFrame();
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

export async function driveType(harness: FixtureHarness, times = 5) {
    const button = screen.getByText('type');
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
    }
}
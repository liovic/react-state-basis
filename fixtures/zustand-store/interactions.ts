// fixtures/zustand-store/interactions.ts

import { screen, fireEvent, act } from '@testing-library/react';
import type { FixtureHarness } from '../_harness';

export async function drive(harness: FixtureHarness, label: string, times = 5) {
    const button = screen.getByText(label);
    for (let i = 0; i < times; i++) {
        await act(async () => {
            fireEvent.click(button);
        });
        await harness.flushFrame();
        await harness.flushFrame();
    }
}
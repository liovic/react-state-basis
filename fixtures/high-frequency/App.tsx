// fixtures/high-frequency/App.tsx

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function SingleValueScene() {
    const [frame, setFrame] = useState(0, 'HighFrequency.tsx -> frame');
    const [clicks, setClicks] = useState(0, 'HighFrequency.tsx -> clicks');

    useEffect(() => {
        let id = 0;
        const tick = () => {
            setFrame((n) => n + 1);
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [], 'HighFrequency.tsx -> effect_raf');

    return (
        <div>
            <button onClick={() => setClicks((n) => n + 1)}>click</button>
            <span data-testid="frame">{frame}</span>
            <span data-testid="clicks">{clicks}</span>
        </div>
    );
}

export function PairedValueScene() {
    const [frame, setFrame] = useState(0, 'HighFrequency.tsx -> frame');
    const [offset, setOffset] = useState(0, 'HighFrequency.tsx -> offset');

    useEffect(() => {
        let id = 0;
        const tick = () => {
            setFrame((n) => n + 1);
            setOffset((n) => n + 1);
            id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(id);
    }, [], 'HighFrequency.tsx -> effect_raf_pair');

    return (
        <div>
            <span data-testid="frame">{frame}</span>
            <span data-testid="offset">{offset}</span>
        </div>
    );
}

export function App({ scene = 'single' }: { scene?: 'single' | 'paired' }) {
    return (
        <BasisProvider debug showHUD={false}>
            {scene === 'paired' ? <PairedValueScene /> : <SingleValueScene />}
        </BasisProvider>
    );
}
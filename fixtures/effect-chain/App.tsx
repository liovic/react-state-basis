// fixtures/effect-chain/App.tsx

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function EffectChainScene() {
    const [a, setA] = useState(0, 'EffectChain.tsx -> a');
    const [b, setB] = useState(0, 'EffectChain.tsx -> b');
    const [c, setC] = useState(0, 'EffectChain.tsx -> c');
    const [noise, setNoise] = useState(0, 'EffectChain.tsx -> noise');

    useEffect(() => {
        setB(a);
    }, [a], 'EffectChain.tsx -> effect_B');

    useEffect(() => {
        setC(b);
    }, [b], 'EffectChain.tsx -> effect_C');

    return (
        <div>
            <button onClick={() => setA((n) => n + 1)}>bumpA</button>
            <button onClick={() => setNoise((n) => n + 1)}>bumpNoise</button>
            <span data-testid="a">{a}</span>
            <span data-testid="b">{b}</span>
            <span data-testid="c">{c}</span>
            <span data-testid="noise">{noise}</span>
        </div>
    );
}

export function App() {
    return (
        <BasisProvider debug showHUD={false}>
            <EffectChainScene />
        </BasisProvider>
    );
}
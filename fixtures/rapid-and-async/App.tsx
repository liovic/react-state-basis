// fixtures/rapid-and-async/App.tsx

import React from 'react';
import { useState } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function BurstScene() {
    const [a, setA] = useState(0, 'RapidAsync.tsx -> a');
    const [b, setB] = useState(0, 'RapidAsync.tsx -> b');
    const [c, setC] = useState(0, 'RapidAsync.tsx -> c');

    const burst = () => {
        setA((n) => n + 1);
        setB((n) => n + 1);
        setC((n) => n + 1);
    };

    return (
        <div>
            <button onClick={burst}>burst</button>
        </div>
    );
}

export function GapScene() {
    const [a, setA] = useState(0, 'RapidAsync.tsx -> a');
    const [b, setB] = useState(0, 'RapidAsync.tsx -> b');

    return (
        <div>
            <button onClick={() => setA((n) => n + 1)}>bumpA</button>
            <button onClick={() => setB((n) => n + 1)}>bumpB</button>
        </div>
    );
}

export function TimeoutScene() {
    const [a, setA] = useState(0, 'RapidAsync.tsx -> a');
    const [b, setB] = useState(0, 'RapidAsync.tsx -> b');

    const kick = () => {
        setA((n) => n + 1);
        setTimeout(() => {
            setB((n) => n + 1);
        }, 500);
    };

    return (
        <div>
            <button onClick={kick}>kick</button>
        </div>
    );
}

export function PromiseScene() {
    const [a, setA] = useState(0, 'RapidAsync.tsx -> a');
    const [b, setB] = useState(0, 'RapidAsync.tsx -> b');

    const kick = () => {
        setA((n) => n + 1);
        Promise.resolve().then(() => {
            setB((n) => n + 1);
        });
    };

    return (
        <div>
            <button onClick={kick}>kick</button>
        </div>
    );
}

export function App({
    scene = 'burst',
}: {
    scene?: 'burst' | 'gap' | 'timeout' | 'promise';
}) {
    return (
        <BasisProvider debug showHUD={false}>
            {scene === 'burst' && <BurstScene />}
            {scene === 'gap' && <GapScene />}
            {scene === 'timeout' && <TimeoutScene />}
            {scene === 'promise' && <PromiseScene />}
        </BasisProvider>
    );
}
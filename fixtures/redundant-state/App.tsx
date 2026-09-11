// fixtures/redundant-state/App.tsx

import React, { useState as useReactState } from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function RedundantStateScene() {
    const [firstName, setFirstName] = useState('anna', 'RedundantState.tsx -> firstName');
    const [fullName, setFullName] = useState('anna', 'RedundantState.tsx -> fullName');
    const [age, setAge] = useState(0, 'RedundantState.tsx -> age');

    useEffect(() => {
        setFullName(firstName);
    }, [firstName], 'RedundantState.tsx -> effect_L1');

    return (
        <div>
            <button onClick={() => setFirstName((n) => n + 'x')}>rename</button>
            <button onClick={() => setAge((a) => a + 1)}>birthday</button>
            <span data-testid="fullName">{fullName}</span>
            <span data-testid="age">{age}</span>
        </div>
    );
}

export function DerivedDuringRenderScene() {
    const [firstName, setFirstName] = useState('anna', 'DerivedRender.tsx -> firstName');
    const fullName = firstName;
    const [age, setAge] = useState(0, 'DerivedRender.tsx -> age');

    return (
        <div>
            <button onClick={() => setFirstName((n) => n + 'x')}>rename</button>
            <button onClick={() => setAge((a) => a + 1)}>birthday</button>
            <span data-testid="fullName">{fullName}</span>
            <span data-testid="age">{age}</span>
        </div>
    );
}

export function RemountScene() {
    const [gen, setGen] = useReactState(0);
    return (
        <div>
            <button onClick={() => setGen((g) => g + 1)}>remount</button>
            <RedundantStateScene key={gen} />
        </div>
    );
}

export function App({
    scene = 'redundant',
}: {
    scene?: 'redundant' | 'derived' | 'remount';
}) {
    return (
        <BasisProvider debug showHUD={false}>
            {scene === 'derived' && <DerivedDuringRenderScene />}
            {scene === 'remount' && <RemountScene />}
            {scene === 'redundant' && <RedundantStateScene />}
        </BasisProvider>
    );
}
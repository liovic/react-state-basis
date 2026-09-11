// fixtures/multiple-instances/App.ts

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

function CopyRow({ row }: { row: 'a' | 'b' }) {
    const [firstName, setFirstName] = useState('anna', 'Multi.tsx -> firstName');
    const [fullName, setFullName] = useState('anna', 'Multi.tsx -> fullName');

    useEffect(() => {
        setFullName(firstName);
    }, [firstName], 'Multi.tsx -> effect_L1');

    return (
        <div data-testid={`row-${row}`}>
            <button onClick={() => setFirstName((n) => n + 'x')}>{row}-rename</button>
            <span data-testid={`${row}-fullName`}>{fullName}</span>
        </div>
    );
}

export function App() {
    return (
        <BasisProvider debug showHUD={false}>
            <CopyRow row="a" />
            <CopyRow row="b" />
        </BasisProvider>
    );
}
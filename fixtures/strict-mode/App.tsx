// fixtures/strict-mode/App.tsx

import React from 'react';
import { useState, useEffect } from '../../src/hooks';
import { BasisProvider } from '../../src/context';

export function RedundantScene() {
    const [firstName, setFirstName] = useState('anna', 'StrictMode.tsx -> firstName');
    const [fullName, setFullName] = useState('anna', 'StrictMode.tsx -> fullName');
    const [age, setAge] = useState(0, 'StrictMode.tsx -> age');

    useEffect(() => {
        setFullName(firstName);
    }, [firstName], 'StrictMode.tsx -> effect_L1');

    return (
        <div>
            <button onClick={() => setFirstName((n) => n + 'x')}>rename</button>
            <button onClick={() => setAge((n) => n + 1)}>birthday</button>
            <span data-testid="fullName">{fullName}</span>
            <span data-testid="age">{age}</span>
        </div>
    );
}

export function App() {
    return (
        <React.StrictMode>
            <BasisProvider debug showHUD={false}>
                <RedundantScene />
            </BasisProvider>
        </React.StrictMode>
    );
}
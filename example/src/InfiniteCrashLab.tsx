// src/examples/InfiniteCrashLab.tsx


import { useState, useEffect } from 'react-state-basis'

export const InfiniteCrashLab = () => {
    const [count, setCount] = useState(0)
    const [isCrashing, setIsCrashing] = useState(false)

    useEffect(() => {
        if (isCrashing) {
            setCount(prev => prev + 1)
        }
    }, [count, isCrashing])

    return (
        <div style={{ padding: '15px', border: '1px solid #ff4757', margin: '10px' }}>
            <h4 style={{ color: '#ff4757' }}>🛑 3. Infinite Loop Trap</h4>
            <p>Current Count: {count}</p>
            <button
                onClick={() => setIsCrashing(true)}
                style={{ background: '#ff4757', color: 'white' }}
            >
                TRIGGER RECURSIVE CRASH
            </button>
            <p style={{ fontSize: '10px' }}>
                Check console to see "BASIS CRITICAL | CIRCUIT BREAKER"
            </p>
        </div>
    )
}
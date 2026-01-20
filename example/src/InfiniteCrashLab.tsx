import { useState, useEffect } from 'react'

export const InfiniteCrashLab = () => {
    const [count, setCount] = useState(0)
    const [isCrashing, setIsCrashing] = useState(false)

    useEffect(() => {
        if (isCrashing) setCount(prev => prev + 1)
    }, [count, isCrashing])

    return (
        <div className="diagnostic-card">
            <div className="card-tag" style={{ color: 'var(--red)' }}>03 // RECURSION_ALARM</div>
            <h2>Infinite Render Loop</h2>

            <div className="data-readout" style={{ fontSize: '3.5rem', color: count > 0 ? 'var(--red)' : 'var(--text-primary)' }}>
                {count.toString().padStart(2, '0')}
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '20px' }} className="mono">
                STATUS: {isCrashing ? 'CRITICAL_FAILURE' : 'SYSTEM_IDLE'}
            </div>

            <button className="danger" onClick={() => setIsCrashing(true)}>
                START_RECURSIVE_CRASH
            </button>
        </div>
    )
}
import { useState as basisUseState, useEffect } from 'react-state-basis'
import { useState as reactUseState } from 'react'

const StressNode = ({ index }: { index: number }) => {
    const [val, setVal] = basisUseState(0, `stress_node_${index}`)

    useEffect(() => {
        const id = setInterval(() => {
            setVal(v => v + 1)
        }, 100)

        return () => clearInterval(id)
    }, [setVal])

    return null
}

export const StressLab = () => {
    const [active, setActive] = reactUseState(false)

    return (
        <div className="diagnostic-card stress">
            <div className="card-tag">04 // SYSTEM_STRESS_TEST</div>
            <h2>Performance Stress Lab</h2>

            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--zinc-100)' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--zinc-500)' }}>ACTIVE_HOOKS</span>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>{active ? '100' : '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--zinc-100)' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--zinc-500)' }}>TOTAL_VECTORS</span>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700 }}>{active ? '5,000 / cycle' : '0'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span className="mono" style={{ fontSize: '10px', color: 'var(--zinc-500)' }}>CPU_TAX</span>
                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: active ? 'var(--green)' : 'inherit' }}>
                        {active ? '< 0.8%' : 'IDLE'}
                    </span>
                </div>
            </div>

            <button
                onClick={() => setActive(!active)}
                className={active ? "danger" : "primary"}
                style={{ width: '100%', marginTop: '20px' }}
            >
                {active ? "TERMINATE_STRESS_TEST" : "START_100_HOOK_TEST"}
            </button>

            {active && (
                <div key="stress-nodes-container">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <StressNode key={i} index={i} />
                    ))}
                </div>
            )}
        </div>
    )
}
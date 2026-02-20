import { useState, useEffect } from 'react'

export const InfiniteCrashLab = () => {
    const [count, setCount] = useState(0)
    const [isCrashing, setIsCrashing] = useState(false)

    useEffect(() => {
        if (isCrashing) setCount(prev => prev + 1)
    }, [count, isCrashing])

    const dangerLevel = Math.min((count / 150) * 100, 100);

    return (
        <div className="diagnostic-card" style={{
            padding: '24px',
            border: isCrashing ? '1px solid var(--red)' : '1px solid var(--border)',
            background: isCrashing ? 'rgba(255, 49, 49, 0.02)' : 'transparent',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div className="card-tag" style={{
                fontSize: '11px',
                marginBottom: '16px',
                color: isCrashing ? 'var(--red)' : 'var(--slate-500)',
                letterSpacing: '0.1em',
                fontWeight: 700
            }}>
                03 // RECURSION_MONITOR
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>
                Infinite Render Loop
            </h2>
            <p className="mono" style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '24px' }}>
                Simulating recursive state-update exhaustion.
            </p>

            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px 0'
            }}>
                <div style={{
                    fontSize: '92px',
                    fontWeight: 900,
                    lineHeight: 1,
                    fontFamily: '"JetBrains Mono", monospace',
                    color: count > 0 ? 'var(--red)' : 'var(--zinc-800)',
                    letterSpacing: '-4px',
                    fontVariantNumeric: 'tabular-nums'
                }}>
                    {count.toString().padStart(3, '0')}
                </div>

                <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'var(--zinc-100)',
                    marginTop: '20px',
                    borderRadius: '2px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${dangerLevel}%`,
                        height: '100%',
                        background: 'var(--red)',
                        boxShadow: '0 0 10px var(--red)',
                        transition: 'width 0.05s linear'
                    }} />
                </div>
            </div>

            <div style={{
                background: isCrashing ? 'rgba(255, 49, 49, 0.1)' : 'var(--zinc-50)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: isCrashing ? 'var(--red)' : 'var(--zinc-500)' }}>
                    STATUS_LOG:
                </span>
                <span className="mono" style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isCrashing ? 'var(--red)' : 'var(--zinc-800)'
                }}>
                    {isCrashing ? 'CRITICAL_FAILURE' : 'SYSTEM_STABLE'}
                </span>
            </div>

            <button
                className={isCrashing ? "danger" : "primary"}
                onClick={() => setIsCrashing(true)}
                disabled={isCrashing}
                style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '13px',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    border: isCrashing ? '1px solid var(--red)' : 'none'
                }}
            >
                {isCrashing ? 'BREAKER_TRIPPED_//_HALTED' : 'EXECUTE_RECURSIVE_CRASH'}
            </button>
        </div>
    )
}
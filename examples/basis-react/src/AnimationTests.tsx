// src/AnimationTests.tsx

import { useState, useEffect } from 'react';

export default function AnimationTests() {
    return (
        <>
            <TestCase1_60FPS />
            <TestCase2_Slider />
            <TestCase3_DragDrop />
            <TestCase4_CounterSpam />
        </>
    );
}

function TestCase1_60FPS() {
    const [rotation, setRotation] = useState(0);
    const [isRunning, setIsRunning] = useState(false);

    useEffect(() => {
        if (!isRunning) return;
        let animationId: number;
        const animate = () => {
            setRotation(prev => (prev + 2) % 360);
            animationId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(animationId);
    }, [isRunning]);

    return (
        <div className="diagnostic-card" style={{ padding: '24px' }}>
            <div className="card-tag" style={{ fontSize: '11px', marginBottom: '12px' }}>05 // VOLATILITY_TEST_A</div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>60 FPS Rotation</h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginBottom: '20px' }}>
                Heuristic test for high-frequency coordinate updates.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '140px', background: 'rgba(0,0,0,0.03)', borderRadius: '8px', marginBottom: '20px' }}>
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        background: 'linear-gradient(45deg, var(--cyan) 0%, #764ba2 100%)',
                        transform: `rotate(${rotation}deg)`,
                        borderRadius: '12px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }}
                />
            </div>

            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: '20px' }}>
                {rotation.toString().padStart(3, '0')}<span style={{ fontSize: '16px', color: 'var(--slate-400)' }}>°_DEG</span>
            </div>

            <button
                className={isRunning ? "danger" : "primary"}
                onClick={() => setIsRunning(!isRunning)}
                style={{ width: '100%', padding: '14px', fontWeight: 700 }}
            >
                {isRunning ? 'HALT_ROTATION' : 'START_ANIMATION'}
            </button>
        </div>
    );
}

function TestCase2_Slider() {
    const [value, setValue] = useState(50);

    return (
        <div className="diagnostic-card" style={{ padding: '24px' }}>
            <div className="card-tag" style={{ fontSize: '11px', marginBottom: '12px' }}>06 // VOLATILITY_TEST_B</div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Range Slider</h2>
            <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginBottom: '20px' }}>
                Continuous stream verification for slider input.
            </p>

            <div style={{ margin: '30px 0' }}>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--cyan)' }}
                />
                <div style={{
                    width: '100%', height: '12px', background: 'var(--zinc-100)',
                    borderRadius: '6px', marginTop: '24px', overflow: 'hidden'
                }}>
                    <div style={{
                        width: `${value}%`, height: '100%', background: 'var(--cyan)',
                        boxShadow: '0 0 15px var(--cyan)', transition: 'width 0.1s ease-out'
                    }} />
                </div>
            </div>

            <div className="mono" style={{ fontSize: '32px', fontWeight: 800, textAlign: 'center' }}>
                {value.toString().padStart(3, '0')}
            </div>
        </div>
    );
}

function TestCase3_DragDrop() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const bounds = e.currentTarget.getBoundingClientRect();
        setPosition({
            x: Math.round(e.clientX - bounds.left - 40),
            y: Math.round(e.clientY - bounds.top - 40)
        });
    };

    return (
        <div className="diagnostic-card" style={{ padding: '24px', gridColumn: 'span 2' }}>
            <div className="card-tag" style={{ fontSize: '11px', marginBottom: '12px' }}>07 // COORDINATE_STREAM</div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Drag & Drop Engine</h2>

            <div style={{ display: 'flex', gap: '24px' }}>
                <div
                    style={{
                        position: 'relative',
                        flex: 1,
                        height: '240px',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)'
                    }}
                    onMouseMove={handleMouseMove}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                >
                    <div
                        onMouseDown={() => setIsDragging(true)}
                        style={{
                            position: 'absolute',
                            left: `${position.x}px`,
                            top: `${position.y}px`,
                            width: '80px',
                            height: '80px',
                            background: isDragging ? 'var(--red)' : 'var(--cyan)',
                            borderRadius: '8px',
                            cursor: 'grab',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 900,
                            fontSize: '12px',
                            userSelect: 'none',
                            boxShadow: isDragging ? '0 10px 20px rgba(239, 68, 68, 0.3)' : '0 4px 10px rgba(0,0,0,0.1)',
                            transition: 'background 0.2s'
                        }}
                    >
                        {isDragging ? 'ACTIVE' : 'DRAG_ME'}
                    </div>
                </div>

                <div style={{ width: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="mono" style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px' }}>X_COORD</div>
                    <div className="mono" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '16px' }}>{position.x}</div>
                    <div className="mono" style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '4px' }}>Y_COORD</div>
                    <div className="mono" style={{ fontSize: '24px', fontWeight: 700 }}>{position.y}</div>
                </div>
            </div>
        </div>
    );
}

function TestCase4_CounterSpam() {
    const [count, setCount] = useState(0);

    const spamClicks = () => {
        for (let i = 0; i < 50; i++) {
            setTimeout(() => setCount(prev => prev + 1), i * 10);
        }
    };

    return (
        <div className="diagnostic-card" style={{ padding: '24px' }}>
            <div className="card-tag" style={{ fontSize: '11px', marginBottom: '12px', color: 'var(--orange)' }}>08 // BURST_ALARM</div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Rapid Click Spam</h2>

            <div className="mono" style={{
                fontSize: '64px',
                fontWeight: 900,
                textAlign: 'center',
                margin: '30px 0',
                color: count > 0 ? 'var(--orange)' : 'var(--zinc-300)'
            }}>
                {count.toString().padStart(3, '0')}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={spamClicks}
                    className="primary"
                    style={{ flex: 2, padding: '14px', fontWeight: 700, background: 'var(--orange)', border: 'none' }}
                >
                    SPAM_50_UPDATES
                </button>
                <button
                    onClick={() => setCount(0)}
                    className="secondary"
                    style={{ flex: 1, padding: '14px', fontWeight: 700 }}
                >
                    RESET
                </button>
            </div>
        </div>
    );
}
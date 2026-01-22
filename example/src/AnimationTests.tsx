// src/AnimationTests.tsx

import { useState, useEffect } from 'react';

export default function AnimationTests() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <TestCase1_60FPS />
            <TestCase2_Slider />
            <TestCase3_DragDrop />
            <TestCase4_CounterSpam />
        </div>
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
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 1: 60 FPS Rotation</h2>
            <p>Expected: Should animate smoothly</p>
            <p>Bug: Circuit breaker will halt after ~500ms (25 updates in 500ms window)</p>

            <div
                style={{
                    width: '100px',
                    height: '100px',
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    transform: `rotate(${rotation}deg)`,
                    margin: '20px 0',
                    transition: 'transform 0.016s linear'
                }}
            />

            <button onClick={() => setIsRunning(!isRunning)}>
                {isRunning ? 'Stop' : 'Start'} Animation
            </button>

            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Rotation: {rotation}°
            </p>
        </div>
    );
}

function TestCase2_Slider() {
    const [value, setValue] = useState(50);

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 2: Range Slider</h2>
            <p>Expected: Slider should move smoothly</p>
            <p>Bug: May halt if dragged quickly</p>

            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                style={{ width: '300px' }}
            />

            <div
                style={{
                    width: `${value}%`,
                    height: '30px',
                    background: '#10b981',
                    marginTop: '10px',
                    transition: 'width 0.05s'
                }}
            />

            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Value: {value}
            </p>
        </div>
    );
}

function TestCase3_DragDrop() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - 50,
            y: e.clientY - 50
        });
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 3: Drag & Drop</h2>
            <p>Expected: Box should follow mouse smoothly</p>
            <p>Bug: Will freeze after dragging for ~500ms</p>

            <div
                style={{
                    position: 'relative',
                    width: '400px',
                    height: '300px',
                    background: '#f3f4f6',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={() => setIsDragging(false)}
            >
                <div
                    onMouseDown={() => setIsDragging(true)}
                    style={{
                        position: 'absolute',
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        width: '100px',
                        height: '100px',
                        background: isDragging ? '#ef4444' : '#3b82f6',
                        borderRadius: '8px',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        userSelect: 'none'
                    }}
                >
                    {isDragging ? 'Dragging' : 'Drag Me'}
                </div>
            </div>

            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                Position: ({position.x}, {position.y})
            </p>
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
        <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
            <h2>Test 4: Rapid Click Spam</h2>
            <p>Expected: All clicks should register</p>
            <p>This one SHOULD trigger circuit breaker (it's actually a problem)</p>

            <button
                onClick={spamClicks}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    background: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Spam 50 Updates
            </button>

            <div
                style={{
                    fontSize: '48px',
                    fontWeight: 'bold',
                    marginTop: '20px',
                    color: count > 0 ? '#10b981' : '#666'
                }}
            >
                {count}
            </div>

            <button
                onClick={() => setCount(0)}
                style={{
                    marginTop: '10px',
                    padding: '5px 10px',
                    fontSize: '12px'
                }}
            >
                Reset
            </button>
        </div>
    );
}
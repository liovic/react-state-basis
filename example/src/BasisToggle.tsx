// example/src/BasisToggle.tsx

import { useState, useEffect } from 'react';

export const BasisToggle = () => {
  const [isActive, setIsActive] = useState(true);

  const toggle = () => {
    const newState = !isActive;
    
    const key = Symbol.for('__basis_engine_instance__');
    const instance = (globalThis as any)[key];
    
    if (instance) {
      instance.config.debug = newState;
      console.log(`[BASIS] debug = ${newState}`);
    }
    
    setIsActive(newState);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: '#18181b',
      border: `2px solid ${isActive ? '#10b981' : '#ef4444'}`,
      borderRadius: '8px',
      padding: '16px 20px',
      zIndex: 9999
    }}>
      <div style={{ 
        fontSize: '11px', 
        color: '#71717a', 
        marginBottom: '10px',
        letterSpacing: '0.1em'
      }}>
        ENGINE
      </div>

      <button
        onClick={toggle}
        style={{
          background: isActive ? '#ef4444' : '#10b981',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          width: '100%'
        }}
      >
        {isActive ? '● ON - CLICK TO DISABLE' : '○ OFF - CLICK TO ENABLE'}
      </button>
    </div>
  );
};
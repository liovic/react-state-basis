// src/production.ts

export * from './production-hooks';

// No-op Kernel exports
export const registerVariable = () => { };
export const unregisterVariable = () => { };
export const recordUpdate = () => true;
export const beginEffectTracking = () => { };
export const endEffectTracking = () => { };
export const printBasisHealthReport = () => { };
export const configureBasis = () => { };

// Static Mock for Metrics
export const getBasisMetrics = () => ({
    engine: 'production',
    hooks: 0,
    analysis_ms: '0'
});

export const config = { debug: false };

export type { ReactNode, FC } from 'react';
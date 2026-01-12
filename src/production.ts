// src/production.ts

export * from './production-hooks';

export const registerVariable = () => { };
export const unregisterVariable = () => { };
export const recordUpdate = () => true;
export const beginEffectTracking = () => { };
export const endEffectTracking = () => { };
export const printBasisHealthReport = () => { };
export const configureBasis = () => { };

export type { ReactNode, FC } from 'react';
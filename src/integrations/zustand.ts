// src/integrations/zustand.ts

import type { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { registerVariable, recordUpdate } from '../engine';
import { SignalRole } from '../core/types';

type BasisMiddleware = <
    T extends object,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(
    config: StateCreator<T, Mps, Mcs>,
    name: string
) => StateCreator<T, Mps, Mcs>;

export const basisLogger: BasisMiddleware = (config, name) => {

    return (set, get, api) => {
        let registered = false;

        const loggedSet = (...args: any[]) => {
            if (!registered) {
                registerVariable(name, { role: SignalRole.STORE });
                registered = true;
            }

            const prev = get();
            (set as any)(...args);
            const next = get();

            Object.keys(next).forEach(key => {
                if ((prev as any)[key] !== (next as any)[key]) {
                    const keyLabel = `${name} -> ${key}`;
                    registerVariable(keyLabel, { role: SignalRole.STORE });
                    recordUpdate(keyLabel);
                }
            });

            recordUpdate(name);
        };
        return config(loggedSet as any, get, api);
    };
};
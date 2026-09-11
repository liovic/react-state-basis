// fixtures/zustand-store/store.ts

import { create } from 'zustand';
import { basisLogger } from '../../src/integrations/zustand';

type ShopState = {
    theme: 'light' | 'dark';
    count: number;
    isLoading: boolean;
    data: string | null;
    toggleTheme: () => void;
    increment: () => void;
    fetchAll: () => void;
};

export const useShopStore = create<ShopState>()(
    basisLogger(
        (set) => ({
            theme: 'light',
            count: 0,
            isLoading: false,
            data: null,
            toggleTheme: () =>
                set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
            increment: () => set((s) => ({ count: s.count + 1 })),
            fetchAll: () => set({ isLoading: true, data: 'ok' }),
        }),
        'ShopStore'
    )
);

type AuthState = {
    user: string | null;
    login: () => void;
};

export const useAuthStore = create<AuthState>()(
    basisLogger(
        (set) => ({
            user: null,
            login: () => set({ user: 'ada' }),
        }),
        'AuthStore'
    )
);
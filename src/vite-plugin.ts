import type { Plugin } from 'vite';
export function basis(): Plugin {
  return {
    name: 'vite-plugin-react-state-basis',
    config() {
      return {
        optimizeDeps: {
          exclude: ['react-state-basis']
        }
      };
    }
  };
}
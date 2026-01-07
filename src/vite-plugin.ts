// src/vite-plugin.ts

import type { Plugin } from 'vite';

export function basis(): Plugin {
  return {
    name: 'vite-plugin-react-state-basis',
    enforce: 'pre',

    resolveId(source, importer) {
      if (source === 'react' || source === 'react-dom' || source === 'react-dom/client') {
        
        const isLibraryCore = importer && (
          (importer.includes('react-state-basis/src') || importer.includes('react-state-basis/dist')) &&
          !importer.includes('react-state-basis/example')
        );

        const isYalc = importer && importer.includes('.yalc');

        if (isLibraryCore || isYalc) {
          return null;
        }

        const mapping: Record<string, string> = {
          'react': 'react-state-basis',
          'react-dom': 'react-state-basis',
          'react-dom/client': 'react-state-basis/client'
        };

        return this.resolve(mapping[source], importer, { skipSelf: true });
      }
      return null;
    }
  };
}
// src/client.ts

import * as ReactDOMClient from 'react-dom/client';

export const createRoot = (ReactDOMClient as any).createRoot;
export const hydrateRoot = (ReactDOMClient as any).hydrateRoot;

export default ReactDOMClient;
// src/ui/config.ts

import { WINDOW_SIZE } from '../core/constants';

export const HUD_DIMENSIONS = {
  WINDOW_SIZE,
  ROW_HEIGHT: 16,
  COL_WIDTH: 5,
  LABEL_WIDTH: 100,
  PADDING: 10,
  RADIUS: 1.5,
};

export const HUD_THEME = {
  bg: 'rgba(15, 23, 42, 0.95)',
  border: '#334155',
  header: '#8b5cf6',
  text: '#f1f5f9',
  textDim: '#94a3b8',
  success: '#10b981',
  error: '#ef4444',
  grid: '#1e293b',
};

export const getHUDContainerStyle = (isExpanded: boolean): React.CSSProperties => ({
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: HUD_THEME.bg,
  border: `1px solid ${HUD_THEME.border}`,
  borderRadius: '12px',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
  zIndex: 999999,
  overflow: 'hidden',
  width: isExpanded ? '380px' : '130px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none'
});
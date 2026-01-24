// src/ui/BasisHUD.tsx

import React, { useEffect, useRef, useState } from 'react';
import { history, redundantLabels } from '../engine';
import { HUD_DIMENSIONS as DIM, getHUDContainerStyle, HUD_THEME as THEME } from './config';

export const BasisHUD: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isExpanded) return;

    let animationFrame: number;
    let isMounted = true;

    const draw = () => {
      if (!isMounted) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const entries = Array.from(history.entries());
      const dpr = window.devicePixelRatio || 1;

      const rawWidth = DIM.WINDOW_SIZE * DIM.COL_WIDTH + DIM.LABEL_WIDTH + DIM.PADDING * 2;
      const rawHeight = Math.max(entries.length * DIM.ROW_HEIGHT + DIM.PADDING * 2, 60);

      updateCanvasSize(canvas, rawWidth, rawHeight, dpr);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rawWidth, rawHeight);

      if (entries.length === 0) {
        renderEmptyState(ctx);
      } else {
        renderMatrix(ctx, entries);
      }

      ctx.restore();
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [isExpanded]);

  return (
    <div style={getHUDContainerStyle(isExpanded)} onClick={() => setIsExpanded(!isExpanded)}>
      <HUDHeader isExpanded={isExpanded} />
      {isExpanded && (
        <div style={{ padding: '10px 14px 15px 14px' }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
          <HUDFooter />
        </div>
      )}
    </div>
  );
};

function updateCanvasSize(canvas: HTMLCanvasElement, w: number, h: number, dpr: number) {
  const targetW = Math.floor(w * dpr);
  const targetH = Math.floor(h * dpr);
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }
}

function renderEmptyState(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = THEME.textDim;
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Waiting for state transitions...', DIM.PADDING, 30);
}

function renderMatrix(ctx: CanvasRenderingContext2D, entries: [string, any][]) {
  const L = DIM.WINDOW_SIZE;
  const colW = DIM.COL_WIDTH;
  const rowH = DIM.ROW_HEIGHT;
  const pad = DIM.PADDING;
  const cellW = colW - 1.5;
  const cellH = rowH - 4;

  // 1. BATCH THE PATHS
  const gridPath = new Path2D();
  const successPath = new Path2D();
  const errorPath = new Path2D();

  ctx.font = "11px Inter, Menlo, monospace";

  let rowIndex = 0;
  for (const [label, meta] of entries) {
    const y = rowIndex * rowH + pad;
    const isRedundant = redundantLabels.has(label);
    const { buffer, head } = meta;

    let uiPos = 0;

    const addToPath = (val: number, xIdx: number) => {
      const x = xIdx * colW + pad;
      if (val === 1) {
        (isRedundant ? errorPath : successPath).rect(x, y, cellW, cellH);
      } else {
        gridPath.rect(x, y, cellW, cellH);
      }
    };

    // Part 1: Head to End (Old data)
    for (let i = head; i < L; i++) addToPath(buffer[i], uiPos++);
    // Part 2: Start to Head (New data)
    for (let i = 0; i < head; i++) addToPath(buffer[i], uiPos++);

    // 2. LABELS
    const stateName = label.split(' -> ')[1] || label;
    const textX = (L * colW) + pad + 10;

    // We only recalculate density here because it's for UI only
    let density = 0;
    for (let i = 0; i < L; i++) density += buffer[i];
    const isVolatile = density > 25;

    ctx.fillStyle = isRedundant ? THEME.error : (isVolatile ? THEME.success : THEME.text);
    ctx.fillText((isRedundant ? "! " : isVolatile ? "~ " : "") + stateName, textX, y + 9);

    rowIndex++;
  }

  // 3. EXECUTE ONLY 3 DRAWS
  ctx.fillStyle = THEME.grid; ctx.fill(gridPath);
  ctx.fillStyle = THEME.success; ctx.fill(successPath);
  ctx.fillStyle = THEME.error; ctx.fill(errorPath);
}

const HUDHeader: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <div
    style={{
      padding: '10px 14px',
      backgroundColor: isExpanded ? THEME.header : 'transparent',
      color: isExpanded ? 'white' : THEME.header,
      fontWeight: 600,
      fontSize: '11px',
      letterSpacing: '0.05em',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'background 0.3s',
    }}
  >
    <span>{isExpanded ? 'STATE BASIS MATRIX' : '📐 BASIS ACTIVE'}</span>
    {isExpanded && <span style={{ opacity: 0.8, fontSize: '9px' }}>v0.4.2</span>}
  </div>
);

const HUDFooter: React.FC = () => (
  <div
    style={{
      marginTop: '12px',
      paddingTop: '8px',
      borderTop: `1px solid ${THEME.grid}`,
      color: THEME.textDim,
      fontSize: '9px',
      display: 'flex',
      justifyContent: 'space-between',
    }}
  >
    <span>RING BUFFER ENGINE</span>
    <span>ZERO ALLOC</span>
  </div>
);
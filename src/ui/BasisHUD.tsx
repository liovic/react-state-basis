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

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const entries = Array.from(history.entries());
      const dpr = window.devicePixelRatio || 1;

      const rawWidth = (DIM.WINDOW_SIZE * DIM.COL_WIDTH) + DIM.LABEL_WIDTH + (DIM.PADDING * 2);
      const rawHeight = Math.max(entries.length * DIM.ROW_HEIGHT + (DIM.PADDING * 2), 60);

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
    return () => cancelAnimationFrame(animationFrame);
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

function renderMatrix(ctx: CanvasRenderingContext2D, entries: [string, number[]][]) {
  entries.forEach(([label, vector], rowIndex) => {
    const y = rowIndex * DIM.ROW_HEIGHT + DIM.PADDING;
    const stateName = label.split(' -> ')[1] || label;

    // v0.4.1 Volatility Logic
    const density = vector.reduce((acc, bit) => acc + bit, 0);
    const isVolatile = density > 25;
    const isRedundant = redundantLabels.has(label);

    vector.forEach((bit, colIndex) => {
      const x = colIndex * DIM.COL_WIDTH + DIM.PADDING;
      ctx.fillStyle = bit === 1
        ? (isRedundant ? THEME.error : THEME.success)
        : THEME.grid;

      const w = DIM.COL_WIDTH - 1.5;
      const h = DIM.ROW_HEIGHT - 4;

      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, DIM.RADIUS);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    });

    const textX = (DIM.WINDOW_SIZE * DIM.COL_WIDTH) + DIM.PADDING + 10;

    ctx.fillStyle = isRedundant
      ? THEME.error
      : (isVolatile ? THEME.success : THEME.text);

    ctx.font = `${(isRedundant || isVolatile) ? '600' : '400'} 11px Inter, Menlo, monospace`;

    let prefix = "";
    if (isRedundant) prefix = "! ";
    else if (isVolatile) prefix = "~ ";

    const cleanName = prefix + stateName;
    const truncatedName = cleanName.length > 18 ? cleanName.substring(0, 16) + '..' : cleanName;
    ctx.fillText(truncatedName, textX, y + 9);
  });
}

const HUDHeader: React.FC<{ isExpanded: boolean }> = ({ isExpanded }) => (
  <div style={{
    padding: '10px 14px',
    backgroundColor: isExpanded ? THEME.header : 'transparent',
    color: isExpanded ? 'white' : THEME.header,
    fontWeight: 600, fontSize: '11px', letterSpacing: '0.05em',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    transition: 'background 0.3s'
  }}>
    <span>{isExpanded ? 'STATE BASIS MATRIX' : '📐 BASIS ACTIVE'}</span>
    {isExpanded && <span style={{ opacity: 0.8, fontSize: '9px' }}>R50</span>}
  </div>
);

const HUDFooter: React.FC = () => (
  <div style={{
    marginTop: '12px', paddingTop: '8px', borderTop: `1px solid ${THEME.grid}`,
    color: THEME.textDim, fontSize: '9px', display: 'flex', justifyContent: 'space-between'
  }}>
    <span>LINEAR DEPENDENCY AUDIT</span>
    <span>THRESHOLD 0.88</span>
  </div>
);

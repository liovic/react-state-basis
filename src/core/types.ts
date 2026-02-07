// src/core/types.ts

export enum SignalRole {
  LOCAL = 'local',
  CONTEXT = 'context',
  PROJECTION = 'proj',
}

export interface StateOptions { 
  label?: string; 
  suppressAll?: boolean; 
  role?: SignalRole; 
}

export interface RingBufferMetadata { 
  buffer: Uint8Array; 
  head: number; 
  density: number; 
  options: StateOptions;
  role: SignalRole; 
}

export interface Entry {
  label: string;
  meta: RingBufferMetadata;
  isVolatile: boolean;
}

export interface ViolationDetail {
  type: 'causal_leak' | 'context_mirror' | 'duplicate_state';
  target: string;
  similarity?: number;
}

export interface RankedIssue {
  label: string;
  metric: 'influence' | 'density' | 'redundancy';
  score: number;
  reason: string;
  violations: ViolationDetail[]; 
}

export interface PerformanceMetrics { 
  lastAnalysisTimeMs: number; 
  comparisonCount: number; 
  lastAnalysisTimestamp: number;
  systemEntropy: number; 
}

export interface BasisEngineState {
  config: { debug: boolean };
  history: Map<string, RingBufferMetadata>;
  currentTickBatch: Set<string>;
  redundantLabels: Set<string>;
  booted: boolean;
  tick: number;
  isBatching: boolean;
  currentEffectSource: string | null;
  lastStateUpdate: string | null;
  pausedVariables: Set<string>;
  metrics: PerformanceMetrics;
  alertCount: number;
  loopCounters: Map<string, number>;
  lastCleanup: number;
  graph: Map<string, Map<string, number>>; 
  violationMap: Map<string, ViolationDetail[]>;
}

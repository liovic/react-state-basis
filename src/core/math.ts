// src/core/math.ts

/**
 * CIRCULAR SIMILARITY (v0.5.x)
 * Calculates Cosine Similarity across circular buffers.
 * 
 * Optimization: Pre-normalizes the circular offset using a single modulo operation 
 * outside the hot loop. This ensures the inner loop stays linearized (no division) 
 * while remaining robust against extreme lead/lag values.
 */
export const calculateSimilarityCircular = (
  bufferA: Uint8Array,
  headA: number,
  bufferB: Uint8Array,
  headB: number,
  offset: number
): number => {
  const L = bufferA.length;
  let dot = 0, magA = 0, magB = 0;

  const baseOffset = ((headB - headA + offset) % L + L) % L;

  for (let i = 0; i < L; i++) {
    const valA = bufferA[i];

    let iB = i + baseOffset;
    if (iB >= L) {
      iB -= L;
    }

    const valB = bufferB[iB];

    dot += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  // Prevent Divide-by-Zero (Orthogonal/Idle result)
  if (magA === 0 || magB === 0) return 0;

  // Cosine Similarity Formula: (A · B) / (||A|| * ||B||)
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

export const calculateCosineSimilarity = (A: Uint8Array, B: Uint8Array): number => {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < A.length; i++) {
    dot += A[i] * B[i];
    magA += A[i] * A[i];
    magB += B[i] * B[i];
  }
  return (magA === 0 || magB === 0) ? 0 : dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

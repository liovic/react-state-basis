// src/core/math.ts

export const calculateSimilarityWithOffset = (
  A: number[],
  B: number[],
  offsetA: number,
  offsetB: number,
  length: number
): number => {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < length; i++) {
    const valA = A[i + offsetA];
    const valB = B[i + offsetB];

    dot += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  if (magA === 0 || magB === 0) return 0;

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};


export const calculateCosineSimilarity = (A: number[], B: number[]): number => {
  return calculateSimilarityWithOffset(A, B, 0, 0, A.length);
};
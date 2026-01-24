// src/core/math.ts

export const calculateSimilarityCircular = (
  bufferA: Uint8Array,
  headA: number,
  bufferB: Uint8Array,
  headB: number,
  offset: number
): number => {
  const L = bufferA.length;
  let dot = 0;
  let magA = 0;
  let magB = 0;

  const headOffset = headB - headA + offset;

  for (let i = 0; i < L; i++) {
    const valA = bufferA[i];

    let iB = i + headOffset;
    if (iB < 0) iB += L;
    else if (iB >= L) iB -= L;

    const valB = bufferB[iB];

    dot += valA * valB;
    magA += valA * valA;
    magB += valB * valB;
  }

  if (magA === 0 || magB === 0) return 0;
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
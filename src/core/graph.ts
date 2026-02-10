// src/core/graph.ts

export const calculateSpectralInfluence = (
  graph: Map<string, Map<string, number>>,
  maxIterations = 20,
  tolerance = 0.001
) => {
  const nodes = Array.from(new Set([...graph.keys(), ...Array.from(graph.values()).flatMap(m => [...m.keys()])]));
  if (nodes.length === 0) return new Map<string, number>();

  let scores = new Map<string, number>();
  // Initialize: Every node starts with equal weight
  nodes.forEach(n => scores.set(n, 1 / nodes.length));

  for (let i = 0; i < maxIterations; i++) {
    const nextScores = new Map<string, number>();
    let totalWeight = 0;

    nodes.forEach(source => {
      let influence = 0;
      const outgoing = graph.get(source);

      if (outgoing) {
        outgoing.forEach((weight, target) => {
          // Rule: Source is important if it triggers targets that are active/important
          // We skip self-loops (source === target) to prevent artificial inflation
          if (source !== target) {
            influence += (scores.get(target) || 0) * weight;
          }
        });
      }
      // Every node has a "Base" existence weight to prevent sinks from reaching 0
      nextScores.set(source, influence + 0.01);
      totalWeight += (influence + 0.01);
    });

    // Normalize
    let delta = 0;
    nextScores.forEach((val, key) => {
      const normalized = val / totalWeight;
      const diff = normalized - (scores.get(key) || 0);
      delta += diff * diff;
      nextScores.set(key, normalized);
    });

    scores = nextScores;
    if (Math.sqrt(delta) < tolerance) break;
  }

  return scores;
};

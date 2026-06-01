export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function similarityScorePercent(cosine: number): number {
  const clamped = Math.max(0, Math.min(1, cosine));
  return Math.round(clamped * 100);
}

export function similarityLabel(score: number): string {
  if (score >= 85) return "Very similar taste";
  if (score >= 70) return "Similar taste";
  if (score >= 55) return "Some overlap";
  if (score >= 40) return "Different tastes";
  return "Quite different";
}

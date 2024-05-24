import * as math from "mathjs";

export function calcCosineSimilarity(vectorA: number[], vectorB: number[]) {
  // Compute the dot product of the two vectors
  const dotProduct = math.dot(vectorA, vectorB) as number;

  // Compute the magnitude (norm) of each vector
  const magnitudeA = math.norm(vectorA) as number;
  const magnitudeB = math.norm(vectorB) as number;

  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

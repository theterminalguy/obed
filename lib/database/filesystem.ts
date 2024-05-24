import { readFile } from "fs/promises";
import { EmbeddingResponse } from "../embeddings.interface";
import { calcCosineSimilarity } from "../math";

function sortByScoreAsc(records: { score: number }[]) {
  return records.sort((a, b) => b.score - a.score);
}

function findNearest(
  k: number,
  target: EmbeddingResponse,
  vectorSpace: EmbeddingResponse[]
) {
  const results: Array<{
    label: string;
    score: number;
  }> = [];
  // get cosine similarity between target and each embedding
  const len = vectorSpace.length;
  for (let i = 0; i < len; i++) {
    const score = calcCosineSimilarity(
      target.embeddings,
      vectorSpace[i].embeddings
    );
    results.push({
      label: vectorSpace[i].label,
      score,
    });
  }
  return sortByScoreAsc(results).slice(0, k);
}

export async function findTopK(
  k: number,
  targetLabel: string,
  ts: number
) {
  const fileContent = await readFile(`history/${ts}/output.json`, "utf8");
  const embeddings = JSON.parse(fileContent) as EmbeddingResponse[];
  const targetEmbedding = embeddings.find((e) => e.label === targetLabel);
  if (!targetEmbedding)
    throw new Error("target input not found in vector space");

  // remove target from vector space
  const newEmbeddings = embeddings.filter((e) => e.label != targetLabel);

  const result = findNearest(k, targetEmbedding, newEmbeddings);

  // Log the sorted results
  console.log(`The top ${k} similar items to ${targetLabel} are:`, result);
}

import "dotenv/config";
import { generateEmbedding } from "./embeddings";
import { EmbeddingInput } from "./embeddings.interface";
import { Provider, Models } from "./providers";
import { createFolder, createFile } from "./fs";

export async function run(
  provider: Provider,
  model: Models,
  input: EmbeddingInput[]
) {
  if (!input.length) return;
  const result = await generateEmbedding(provider, {
    input,
    model,
  });
  const timestamp = `${Date.now()}`;
  // create folder
  await createFolder(`${timestamp}`);

  // create input.json
  await createFile(
    `${timestamp}/input.json`,
    JSON.stringify({
      timestamp,
      provider,
      model,
      input,
    })
  );

  const runTS = `
import { findTopK } from "../../lib/database/filesystem";

findTopK(5, "${input[0].label}", ${timestamp});
`;
  // create run.js
  await createFile(`${timestamp}/run.ts`, runTS);

  // create output.json
  await createFile(`${timestamp}/output.json`, JSON.stringify(result));
}

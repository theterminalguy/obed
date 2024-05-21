import z from "zod";
import * as math from "mathjs";
import "dotenv/config";
import fs, { readFile } from "fs/promises";
import * as path from "path";

function getCosineSimilarity(vectorA: number[], vectorB: number[]) {
  // Compute the dot product of the two vectors
  const dotProduct = math.dot(vectorA, vectorB) as number;

  // Compute the magnitude (norm) of each vector
  const magnitudeA = math.norm(vectorA) as number;
  const magnitudeB = math.norm(vectorB) as number;

  // Calculate cosine similarity
  return dotProduct / (magnitudeA * magnitudeB);
}

function sortByScoreAsc(records: { score: number }[]) {
  return records.sort((a, b) => b.score - a.score);
}

function findNearest(
  k: number,
  target: EmbeddingResponse,
  vectorSpace: EmbeddingResponse[]
) {
  const results: Array<{
    input: string;
    score: number;
  }> = [];
  // get cosine similarity between target and each embedding
  const len = vectorSpace.length;
  for (let i = 0; i < len; i++) {
    const score = getCosineSimilarity(
      target.embeddings,
      vectorSpace[i].embeddings
    );
    results.push({
      input: vectorSpace[i].input,
      score,
    });
  }
  return sortByScoreAsc(results).slice(0, k);
}

export async function findTopK(k: number, target: string, ts: number) {
  const fileContent = await readFile(`history/${ts}/output.json`, "utf8");
  const embeddings = JSON.parse(fileContent) as EmbeddingResponse[];
  const targetEmbedding = embeddings.find((e) => e.input === target);
  if (!targetEmbedding)
    throw new Error("target input not found in vector space");

  // remove target from vector space
  const newEmbeddings = embeddings.filter((e) => e.input != target);

  const result = findNearest(k, targetEmbedding, newEmbeddings);

  // Log the sorted results
  console.log(`The top ${k} similar items to ${target} are:`, result);
}

/**
 * Convert an array of numbers to a Base64 encoded string
 * @param {number[]} array - The array of numbers to encode
 * @returns {string} - The Base64 encoded string
 */
function base64EncodeArray(array: any[]): string {
  // Convert the array to a binary string
  let binaryString = "";
  for (let i = 0; i < array.length; i++) {
    binaryString += String.fromCharCode(array[i]);
  }

  // Use btoa to encode the binary string to Base64
  return btoa(binaryString);
}

export enum Provider {
  OpenAi = "openai",
  Ollama = "ollam",
}

export enum Models {
  // openai
  TextEmbedding3Small = "text-embedding-3-small",
  TextEmbedding3Large = "text-embedding-3-large",
  TextEmbeddingAda002 = "text-embedding-ada-002",

  // ollama
  MxbaiEmbedLarge = "mxbai-embed-large",
  NomicEmbedText = "nomic-embed-text",
  AllMinilm = "all-minilm",
}

interface RequestPayload {
  input: string[];
  model: string;
}

interface EmbeddingResponse {
  input: string;
  embeddings: number[];
}

// llm providers
const providers = {
  [Provider.OpenAi]: {
    url: "https://api.openai.com/v1/embeddings",
    modelSchema: z.enum([
      Models.TextEmbedding3Small,
      Models.TextEmbedding3Large,
      Models.TextEmbeddingAda002,
    ]),
    authHeader: process.env.OPEN_API_KEY,
    canEmbedMulti: true,
    transform: async function (
      input: string[],
      apiResponse: any
    ): Promise<EmbeddingResponse[]> {
      const responseSchema = z.object({
        data: z.array(
          z.object({
            embedding: z.array(z.number()),
          })
        ),
      });
      const { data } = responseSchema.parse(apiResponse);
      return data.map((v, i) => {
        return { input: input[i], embeddings: v.embedding };
      }) as EmbeddingResponse[];
    },
    toReqBody: function (input: string | string[], model: string): string {
      return JSON.stringify({ input, model });
    },
  },
  [Provider.Ollama]: {
    url: "http://localhost:11434/api/embeddings",
    modelSchema: z.enum([Models.MxbaiEmbedLarge, Models.AllMinilm]),
    authHeader: null,
    canEmbedMulti: false,
    transform: async function (
      input: string[],
      apiResponse: any
    ): Promise<EmbeddingResponse[]> {
      const responseSchema = z.array(
        z.object({
          embedding: z.array(z.number()),
        })
      );
      const data = responseSchema.parse(apiResponse);
      return data.map((v, i) => {
        return { input: input[i], embeddings: v.embedding };
      }) as EmbeddingResponse[];
    },
    toReqBody: function (input: string | string[], model: string): string {
      return JSON.stringify({ prompt: input, model });
    },
  },
};

// Function to generate embeddings
async function generateEmbedding(
  providerName: Provider,
  payload: RequestPayload
): Promise<EmbeddingResponse[]> {
  const provider = providers[providerName];
  provider.modelSchema.parse(payload.model);

  const sendRequest = async function (reqBody: string) {
    // Construct headers
    const headers = {
      "Content-Type": "application/json",
      ...(provider.authHeader
        ? {
            Authorization: `Bearer ${provider.authHeader}`,
          }
        : null),
    };

    // Make the API request
    const response = await fetch(provider.url, {
      method: "POST",
      headers,
      body: reqBody,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    return await response.json();
  };

  if (!provider.canEmbedMulti) {
    const response = (await Promise.all(
      payload.input.map((input) => {
        return sendRequest(provider.toReqBody(input, payload.model));
      })
    )) as Array<{ embedding: number[] }>;

    return await provider.transform(payload.input, response);
  } else {
    const response = await sendRequest(
      provider.toReqBody(payload.input, payload.model)
    );
    return await provider.transform(payload.input, response);
  }
}

async function createFolder(name: string) {
  const newFolderPath = path.join(__dirname, "history", name);

  try {
    await fs.mkdir(newFolderPath);
    console.log("Folder created successfully:", newFolderPath);
  } catch (err: Error | any) {
    if (err.code === "EEXIST") {
      console.log("Folder already exists:", newFolderPath);
    } else {
      console.error("Error creating folder:", err);
    }
  }
}

async function createAndWriteFile(fileName: string, fileContent: string) {
  // Define the path to the new file
  const filePath = path.join(__dirname, "history", fileName);
  try {
    // Write content to the file
    await fs.writeFile(filePath, fileContent, "utf-8");
    console.log("File created and written successfully:", filePath);
  } catch (err) {
    console.error("Error creating or writing to file:", err);
  }
}

export async function run(provider: Provider, model: Models, input: string[]) {
  const result = await generateEmbedding(provider, {
    input,
    model,
  });
  const timestamp = `${Date.now()}`;
  // create folder
  await createFolder(`${timestamp}`);

  // create input.json
  await createAndWriteFile(
    `${timestamp}/input.json`,
    JSON.stringify({
      timestamp,
      provider,
      model,
      input,
    })
  );

  const runTS = `
import { findTopK } from "../../app";

findTopK(5, "${input[0]}", ${timestamp});
`;
  // create run.js
  await createAndWriteFile(`${timestamp}/run.ts`, runTS);

  // create output.json
  await createAndWriteFile(`${timestamp}/output.json`, JSON.stringify(result));
}

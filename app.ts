import z from "zod";
import * as math from "mathjs";
import "dotenv/config";

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
  openai: {
    url: "https://api.openai.com/v1/embeddings",
    modelSchema: z.enum(["text-embedding-3-small"]),
    authHeader: process.env.OPEN_API_KEY,
    canEmbedMulti: true,
    responseSchema: z.object({
      data: z.array(
        z.object({
          embedding: z.array(z.number()),
        })
      ),
    }),
    transform: async function (
      input: string[],
      apiResponse: any
    ): Promise<EmbeddingResponse[]> {
      console.log("ollama", JSON.stringify(apiResponse));
      return [];
    },
    toReqBody: function (input: string | string[], model: string): string {
      return JSON.stringify({ input, model });
    },
  },
  ollama: {
    url: "http://localhost:11434/api/embeddings",
    modelSchema: z.enum(["mxbai-embed-large"]),
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
  providerName: keyof typeof providers,
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

(async () => {
  const result = await generateEmbedding("ollama", {
    input: ["hello", "world"],
    model: "mxbai-embed-large",
  });
  console.log(JSON.stringify(result));
})();

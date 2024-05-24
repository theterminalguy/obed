import z from "zod";
import { EmbeddingInput, EmbeddingResponse } from "./embeddings.interface";

export enum Provider {
  OpenAi = "openai",
  Ollama = "ollam",
  Voyage = "voyage",
}

export enum OpenAIModels {
  TextEmbedding3Small = "text-embedding-3-small",
  TextEmbedding3Large = "text-embedding-3-large",
  TextEmbeddingAda002 = "text-embedding-ada-002",
}

export enum OllamaModels {
  MxbaiEmbedLarge = "mxbai-embed-large",
  NomicEmbedText = "nomic-embed-text",
  AllMinilm = "all-minilm",
}

export enum VoyageModels {
  VoyageLarge2Instruct = "voyage-large-2-instruct",
}

// export enum Models {
//   // openai
//   TextEmbedding3Small = "text-embedding-3-small",
//   TextEmbedding3Large = "text-embedding-3-large",
//   TextEmbeddingAda002 = "text-embedding-ada-002",

//   // ollama
//   MxbaiEmbedLarge = "mxbai-embed-large",
//   NomicEmbedText = "nomic-embed-text",
//   AllMinilm = "all-minilm",

//   //voyage
//   VoyageLarge2Instruct = "voyage-large-2-instruct",
// }

// llm providers
export const providers = {
  [Provider.OpenAi]: {
    url: "https://api.openai.com/v1/embeddings",
    modelSchema: z.nativeEnum(OpenAIModels),
    authHeader: process.env.OPEN_API_KEY,
    canEmbedMulti: true,
    transform: async function (
      input: EmbeddingInput[],
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
        return {
          label: input[i].label,
          value: input[i].value,
          embeddings: v.embedding,
        };
      }) as EmbeddingResponse[];
    },
    promptLabel: "input",
    modelLabel: "model",
  },
  [Provider.Ollama]: {
    url: "http://localhost:11434/api/embeddings",
    modelSchema: z.nativeEnum(OllamaModels),
    authHeader: null,
    canEmbedMulti: false,
    transform: async function (
      input: EmbeddingInput[],
      apiResponse: any
    ): Promise<EmbeddingResponse[]> {
      const responseSchema = z.array(
        z.object({
          embedding: z.array(z.number()),
        })
      );
      const data = responseSchema.parse(apiResponse);
      return data.map((v, i) => {
        return {
          label: input[i].label,
          value: input[i].value,
          embeddings: v.embedding,
        };
      }) as EmbeddingResponse[];
    },
    promptLabel: "prompt",
    modelLabel: "model",
  },
  [Provider.Voyage]: {
    url: "https://api.voyageai.com/v1/embeddings",
    modelSchema: z.nativeEnum(VoyageModels),
    authHeader: process.env.VOYAGE_API_KEY,
    canEmbedMulti: true,
    transform: async function (
      input: EmbeddingInput[],
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
        return {
          label: input[i].label,
          value: input[i].value,
          embeddings: v.embedding,
        };
      }) as EmbeddingResponse[];
    },
    promptLabel: "input",
    modelLabel: "model",
  },
};

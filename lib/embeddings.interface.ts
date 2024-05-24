export interface EmbeddingInput {
  label: string;
  value: string;
}

export interface EmbeddingRequestPayload {
  input: EmbeddingInput[];
  model: string;
}

export interface EmbeddingResponse {
  label: string;
  value: string;
  embeddings: number[];
}

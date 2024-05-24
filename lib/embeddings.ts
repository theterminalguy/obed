import {
  EmbeddingRequestPayload,
  EmbeddingResponse,
  EmbeddingInput,
} from "./embeddings.interface";
import { Provider, providers } from "./providers";

export async function generateEmbedding(
  providerName: Provider,
  payload: EmbeddingRequestPayload
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
  const labelValues: EmbeddingInput[] = payload.input.map(
    ({ label, value }) => ({ label, value })
  );

  if (!provider.canEmbedMulti) {
    const response = (await Promise.all(
      payload.input.map((input) => {
        const reqBody = {
          [provider.promptLabel]: input.value,
          [provider.modelLabel]: payload.model,
        };
        return sendRequest(JSON.stringify(reqBody));
      })
    )) as Array<{ embedding: number[] }>;
    return await provider.transform(labelValues, response);
  } else {
    const reqBody = {
      [provider.promptLabel]: payload.input.map((i) => i.value),
      [provider.modelLabel]: payload.model,
    };
    const response = await sendRequest(JSON.stringify(reqBody));
    return await provider.transform(labelValues, response);
  }
}

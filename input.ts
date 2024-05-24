import { readAllFilesInFolder } from "./lib/fs";
import {
  OpenAIModels,
  OllamaModels,
  VoyageModels,
  Provider,
} from "./lib/providers";
import { run } from "./lib/run";

const provider: Provider = Provider.Voyage;
const model = OpenAIModels.TextEmbedding3Small;

(async () => {
  const inputs = await readAllFilesInFolder("inputs/");
  run(provider, model, inputs);
})();

// obed gen --src=inputs/ --out=history/ --provider=openai --model=text3234

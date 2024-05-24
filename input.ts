import { readAllFilesInFolder } from "./lib/fs";
import { Models, Provider } from "./lib/providers";
import { run } from "./lib/run";

const provider: Provider = Provider.Voyage;
const model: Models = Models.VoyageLarge2Instruct;

(async () => {
  const inputs = await readAllFilesInFolder("inputs/");
  run(provider, model, inputs);
})();

// obed gen --src=inputs/ --out=history/ --provider=openai --model=text3234

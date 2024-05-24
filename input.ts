import { getInputsFromFolder, Models, Provider, run } from "./app";

const provider: Provider = Provider.OpenAi;
const model: Models = Models.TextEmbedding3Small;
getInputsFromFolder("inputs/").then((input) => {
  run(provider, model, input);
});

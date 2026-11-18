import generatedData from "../models.generated.json";
import { modelsConfig } from "../models.config";
import type { GeneratedModels, ModelStats, ProviderConfig } from "../types";
import { getPricePerToken } from "../utils";

type ConfiguredProviders = typeof modelsConfig.providers;
export type ProviderId = keyof ConfiguredProviders;

/** Every model id offered across providers, as picked in `models.config.ts`. */
export type AvailableModelsId =
  ConfiguredProviders[ProviderId]["models"][number];

const generated: GeneratedModels = generatedData;

function toModelStats(id: string): ModelStats {
  const model = generated.models[id];
  if (!model) {
    throw new Error(
      `Model "${id}" is missing from models.generated.json. Run \`npm run models:build\`.`
    );
  }
  return {
    price: {
      input: getPricePerToken(model.pricing.input),
      output: getPricePerToken(model.pricing.output),
    },
    priceRating: model.priceRating,
    label: model.label,
    hint: model.hint,
  };
}

export const providers: ProviderConfig[] = (
  Object.keys(modelsConfig.providers) as ProviderId[]
).map((id) => {
  const { name, models } = modelsConfig.providers[id];
  return {
    id,
    name,
    models: Object.fromEntries(
      (models as readonly string[]).map((modelId) => [
        modelId,
        toModelStats(modelId),
      ])
    ),
  };
});

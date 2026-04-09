import { describe, it, expect } from "vitest";
import {
  getPricePerToken,
  getModelPriceLabel,
  getModelPriceFullLabel,
  formatPricePerMillion,
  getModelLabel,
  getValidModel,
} from "../utils";
import type { ModelStats, ProviderModels } from "../types";

const makeModel = (overrides: Partial<ModelStats> = {}): ModelStats => ({
  price: { input: 0.0000025, output: 0.000015 },
  priceRating: 3,
  label: "Test Model",
  ...overrides,
});

const sampleModels: ProviderModels = {
  "model-a": makeModel({ label: "Model A" }),
  "model-b": makeModel({ label: "Model B", priceRating: 1 }),
};

describe("getPricePerToken", () => {
  it("converts price per million to price per token", () => {
    expect(getPricePerToken(2.5)).toBeCloseTo(0.0000025);
    expect(getPricePerToken(0)).toBe(0);
    expect(getPricePerToken(1_000_000)).toBe(1);
  });
});

describe("getModelPriceLabel", () => {
  it("returns empty string for priceRating 0", () => {
    expect(getModelPriceLabel(makeModel({ priceRating: 0 }))).toBe("");
  });

  it("returns dollar signs for rating 1-3", () => {
    expect(getModelPriceLabel(makeModel({ priceRating: 1 }))).toBe("$");
    expect(getModelPriceLabel(makeModel({ priceRating: 2 }))).toBe("$$");
    expect(getModelPriceLabel(makeModel({ priceRating: 3 }))).toBe("$$$");
  });

  it("returns $$$+ for rating above 3", () => {
    expect(getModelPriceLabel(makeModel({ priceRating: 4 }))).toBe("$$$+");
    expect(getModelPriceLabel(makeModel({ priceRating: 5 }))).toBe("$$$+");
  });
});

describe("getModelPriceFullLabel", () => {
  it("returns empty string for priceRating 0", () => {
    expect(getModelPriceFullLabel(makeModel({ priceRating: 0 }))).toBe("");
  });

  it("returns exact dollar signs for any rating", () => {
    expect(getModelPriceFullLabel(makeModel({ priceRating: 1 }))).toBe("$");
    expect(getModelPriceFullLabel(makeModel({ priceRating: 4 }))).toBe("$$$$");
    expect(getModelPriceFullLabel(makeModel({ priceRating: 5 }))).toBe(
      "$$$$$",
    );
  });
});

describe("formatPricePerMillion", () => {
  it("formats whole numbers without decimals", () => {
    expect(formatPricePerMillion(0.000015)).toBe("$15");
  });

  it("formats fractional prices with two decimals", () => {
    expect(formatPricePerMillion(0.0000025)).toBe("$2.50");
  });

  it("formats zero", () => {
    expect(formatPricePerMillion(0)).toBe("$0");
  });
});

describe("getModelLabel", () => {
  it("returns label for known model", () => {
    expect(getModelLabel("model-a", sampleModels)).toBe("Model A");
  });

  it("returns modelId for unknown model", () => {
    expect(getModelLabel("unknown-model", sampleModels)).toBe("unknown-model");
  });

  it("returns 'Unknown model' for null/undefined", () => {
    expect(getModelLabel(null, sampleModels)).toBe("Unknown model");
    expect(getModelLabel(undefined, sampleModels)).toBe("Unknown model");
  });
});

describe("getValidModel", () => {
  const defaultModel = "model-a";

  it("returns the model if it exists", () => {
    expect(getValidModel("model-b", sampleModels, defaultModel)).toBe(
      "model-b",
    );
  });

  it("returns default for unknown model", () => {
    expect(getValidModel("nope", sampleModels, defaultModel)).toBe("model-a");
  });

  it("returns default for null/undefined", () => {
    expect(getValidModel(null, sampleModels, defaultModel)).toBe("model-a");
    expect(getValidModel(undefined, sampleModels, defaultModel)).toBe(
      "model-a",
    );
  });
});

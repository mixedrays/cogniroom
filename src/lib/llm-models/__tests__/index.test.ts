import { describe, it, expect } from "vitest";
import { ALL_MODELS, DEFAULT_MODEL, resolveModelId, providers } from "../index";
import type { AvailableModelsId } from "../index";

// Picks change with every models.config.ts edit; take a non-default id per provider.
const pickedId = (providerId: string) =>
  Object.keys(providers.find((p) => p.id === providerId)?.models ?? {}).find(
    (id) => id !== DEFAULT_MODEL
  )!;

describe("DEFAULT_MODEL", () => {
  it("is a real, registered model id", () => {
    expect(DEFAULT_MODEL in ALL_MODELS).toBe(true);
  });
});

describe("ALL_MODELS", () => {
  it("merges models from every provider", () => {
    for (const provider of providers) {
      for (const id of Object.keys(provider.models)) {
        expect(ALL_MODELS).toHaveProperty([id]);
      }
    }
  });
});

describe("resolveModelId", () => {
  it("returns a known model unchanged", () => {
    const id = pickedId("openai");
    expect(resolveModelId(id)).toBe(id);
  });

  it("resolves ids from non-default providers", () => {
    // Anthropic and OpenRouter ids must round-trip too — the union is honest
    // about every live provider, not just OpenAI.
    for (const providerId of ["anthropic", "openrouter"]) {
      const id = pickedId(providerId);
      expect(resolveModelId(id)).toBe(id);
    }
  });

  it("trims surrounding whitespace before validating", () => {
    const id = pickedId("openai");
    expect(resolveModelId(`  ${id}  `)).toBe(id);
  });

  it("falls back to DEFAULT_MODEL for unknown ids", () => {
    expect(resolveModelId("totally-made-up-model")).toBe(DEFAULT_MODEL);
  });

  it("falls back to DEFAULT_MODEL for null/undefined/empty", () => {
    expect(resolveModelId(null)).toBe(DEFAULT_MODEL);
    expect(resolveModelId(undefined)).toBe(DEFAULT_MODEL);
    expect(resolveModelId("")).toBe(DEFAULT_MODEL);
    expect(resolveModelId("   ")).toBe(DEFAULT_MODEL);
  });

  it("returns a value assignable to AvailableModelsId", () => {
    const resolved: AvailableModelsId = resolveModelId(DEFAULT_MODEL);
    expect(resolved).toBe(DEFAULT_MODEL);
  });
});

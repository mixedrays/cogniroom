import { describe, it, expect } from "vitest";
import { ALL_MODELS, DEFAULT_MODEL, resolveModelId, providers } from "../index";
import type { AvailableModelsId } from "../index";

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
    expect(resolveModelId("gpt-5-mini")).toBe("gpt-5-mini");
  });

  it("resolves ids from non-default providers", () => {
    // Anthropic and OpenRouter ids must round-trip too — the union is honest
    // about every live provider, not just OpenAI.
    expect(resolveModelId("claude-sonnet-4-6")).toBe("claude-sonnet-4-6");
    expect(resolveModelId("anthropic/claude-opus-4.7")).toBe(
      "anthropic/claude-opus-4.7"
    );
  });

  it("trims surrounding whitespace before validating", () => {
    expect(resolveModelId("  gpt-5-mini  ")).toBe("gpt-5-mini");
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
    const resolved: AvailableModelsId = resolveModelId("gpt-5-mini");
    expect(resolved).toBe("gpt-5-mini");
  });
});

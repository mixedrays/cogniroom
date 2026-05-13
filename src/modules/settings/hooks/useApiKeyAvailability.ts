import { useCallback, useEffect, useMemo, useState } from "react";
import { providers, getProviderLocalStorageKeyName } from "@/lib/llm-models";
import { getEnvApiKeys, type ProviderEnvKeyInfo } from "../lib/settings";

export type ApiKeySource = "local" | "env" | "none";

export interface ProviderApiKeyAvailability {
  providerId: string;
  providerName: string;
  envName: string;
  hasEnvKey: boolean;
  envLastChars?: string;
  hasLocalKey: boolean;
  localLastChars?: string;
  effectiveSource: ApiKeySource;
}

function maskLocal(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return trimmed.slice(-4);
}

function readLocalKey(providerId: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(getProviderLocalStorageKeyName(providerId)) ?? "";
}

function buildAvailability(
  envKeys: ProviderEnvKeyInfo[]
): ProviderApiKeyAvailability[] {
  const envByProvider = new Map(envKeys.map((k) => [k.providerId, k]));

  return providers.map((provider) => {
    const env = envByProvider.get(provider.id);
    const localValue = readLocalKey(provider.id);
    const hasLocalKey = localValue.trim().length > 0;
    const hasEnvKey = env?.hasKey ?? false;

    return {
      providerId: provider.id,
      providerName: provider.name,
      envName: env?.envName ?? `${provider.id.toUpperCase()}_API_KEY`,
      hasEnvKey,
      envLastChars: env?.lastChars,
      hasLocalKey,
      localLastChars: hasLocalKey ? maskLocal(localValue) : undefined,
      effectiveSource: hasLocalKey ? "local" : hasEnvKey ? "env" : "none",
    };
  });
}

export function useApiKeyAvailability() {
  const [envKeys, setEnvKeys] = useState<ProviderEnvKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [localTick, setLocalTick] = useState(0);

  const refreshLocal = useCallback(() => setLocalTick((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getEnvApiKeys();
      if (cancelled) return;
      if (result.success) setEnvKeys(result.keys);
      setIsLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key) {
        refreshLocal();
        return;
      }
      if (
        providers.some((p) => getProviderLocalStorageKeyName(p.id) === e.key)
      ) {
        refreshLocal();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshLocal]);

  const availability = useMemo(() => {
    // localTick is read so changes to it re-trigger the localStorage read
    void localTick;
    return buildAvailability(envKeys);
  }, [envKeys, localTick]);

  const availableProviderIds = useMemo(
    () =>
      new Set(
        availability
          .filter((a) => a.effectiveSource !== "none")
          .map((a) => a.providerId)
      ),
    [availability]
  );

  return {
    availability,
    isLoading,
    refreshLocal,
    availableProviderIds,
  };
}

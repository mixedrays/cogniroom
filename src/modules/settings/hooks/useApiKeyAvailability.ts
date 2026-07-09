import { useCallback, useMemo } from "react";
import { useSyncExternalStore } from "react";
import { useQuery } from "@tanstack/react-query";
import { providers, getProviderLocalStorageKeyName } from "@/lib/llm-models";
import { getEnvApiKeys, type ProviderEnvKeyInfo } from "../lib/settings";

const EMPTY_ENV_KEYS: ProviderEnvKeyInfo[] = [];

export type ApiKeySource = "local" | "env" | "none";

export interface ProviderApiKeyAvailability {
  providerId: string;
  providerName: string;
  envName: string;
  hasEnvKey: boolean;
  hasLocalKey: boolean;
  localLastChars?: string;
  effectiveSource: ApiKeySource;
}

type LocalKeys = Record<string, string>;

const SERVER_LOCAL_KEYS: LocalKeys = Object.freeze({}) as LocalKeys;

function readLocalKeys(): LocalKeys {
  const next: LocalKeys = {};
  for (const p of providers) {
    next[p.id] =
      localStorage.getItem(getProviderLocalStorageKeyName(p.id)) ?? "";
  }
  return next;
}

function localKeysEqual(a: LocalKeys, b: LocalKeys): boolean {
  if (a === b) return true;
  for (const p of providers) {
    if ((a[p.id] ?? "") !== (b[p.id] ?? "")) return false;
  }
  return true;
}

const localKeyListeners = new Set<() => void>();
let cachedLocalKeys: LocalKeys | null = null;

function getClientLocalKeysSnapshot(): LocalKeys {
  if (cachedLocalKeys === null) cachedLocalKeys = readLocalKeys();
  return cachedLocalKeys;
}

function getServerLocalKeysSnapshot(): LocalKeys {
  return SERVER_LOCAL_KEYS;
}

function invalidateLocalKeys(): void {
  if (typeof window === "undefined") return;
  const next = readLocalKeys();
  if (cachedLocalKeys && localKeysEqual(cachedLocalKeys, next)) return;
  cachedLocalKeys = next;
  for (const listener of localKeyListeners) listener();
}

function subscribeLocalKeys(callback: () => void): () => void {
  localKeyListeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (
      !e.key ||
      providers.some((p) => getProviderLocalStorageKeyName(p.id) === e.key)
    ) {
      invalidateLocalKeys();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    localKeyListeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

function maskLocal(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length <= 4) return "•".repeat(trimmed.length);
  return trimmed.slice(-4);
}

function buildAvailability(
  envKeys: ProviderEnvKeyInfo[],
  localKeys: LocalKeys
): ProviderApiKeyAvailability[] {
  const envByProvider = new Map(envKeys.map((k) => [k.providerId, k]));

  return providers.map((provider) => {
    const env = envByProvider.get(provider.id);
    const localValue = localKeys[provider.id] ?? "";
    const hasLocalKey = localValue.trim().length > 0;
    const hasEnvKey = env?.hasKey ?? false;

    return {
      providerId: provider.id,
      providerName: provider.name,
      envName: env?.envName ?? `${provider.id.toUpperCase()}_API_KEY`,
      hasEnvKey,
      hasLocalKey,
      localLastChars: hasLocalKey ? maskLocal(localValue) : undefined,
      effectiveSource: hasLocalKey ? "local" : hasEnvKey ? "env" : "none",
    };
  });
}

export function useApiKeyAvailability() {
  const localKeys = useSyncExternalStore(
    subscribeLocalKeys,
    getClientLocalKeysSnapshot,
    getServerLocalKeysSnapshot
  );

  // Env-var-backed keys can't change during a session, so fetch them once and
  // share the result across every consumer instead of refetching on each mount
  // (e.g. every time ModelSelect remounts on a course/deck context switch).
  const { data: envKeys = EMPTY_ENV_KEYS, isLoading } = useQuery({
    queryKey: ["settings", "env-api-keys"],
    queryFn: async () => {
      const result = await getEnvApiKeys();
      return result.success ? result.keys : EMPTY_ENV_KEYS;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const refreshLocal = useCallback(() => invalidateLocalKeys(), []);

  const availability = useMemo(
    () => buildAvailability(envKeys, localKeys),
    [envKeys, localKeys]
  );

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

/**
 * Isomorphic agent-memory storage over a `StorageApi`. Mirrors
 * `server/lib/memoryService.ts` (files at `memory/<key>.md`) so browser mode can
 * own memory in IndexedDB. `formatMemoryContext` matches the server's
 * `getMemoryContext` output byte-for-byte so the prompt is identical regardless
 * of which side assembles it.
 */

import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";

export interface MemoryEntry {
  key: string;
  content: string;
}

const VALID_KEY = /^[A-Za-z0-9_-]+$/;

function assertValidKey(key: string): void {
  if (!VALID_KEY.test(key)) {
    throw new Error(`Invalid memory key: ${key}`);
  }
}

export async function readMemory(
  api: StorageApi,
  key: string
): Promise<string | null> {
  assertValidKey(key);
  const res = await api.get<string>(storagePaths.memoryEntry(key));
  if (!res.ok) return null;
  return res.text();
}

export async function writeMemory(
  api: StorageApi,
  key: string,
  content: string
): Promise<void> {
  assertValidKey(key);
  await api.put(storagePaths.memoryEntry(key), content);
}

export async function deleteMemory(
  api: StorageApi,
  key: string
): Promise<boolean> {
  assertValidKey(key);
  const res = await api.delete(storagePaths.memoryEntry(key));
  return res.ok || res.status === 404;
}

export async function listMemoryEntries(
  api: StorageApi
): Promise<MemoryEntry[]> {
  let files;
  try {
    files = await api.list("memory", { files: true, directories: false });
  } catch {
    return [];
  }
  const entries = await Promise.all(
    files
      .filter((f) => f.name.endsWith(".md"))
      .map(async (f) => {
        const res = await api.get<string>(f.path);
        const content = res.ok ? (await res.text()).trim() : "";
        return { key: f.name.slice(0, -3), content };
      })
  );
  return entries
    .filter((e) => e.content.length > 0)
    .sort((a, b) => a.key.localeCompare(b.key));
}

export async function clearAllMemory(api: StorageApi): Promise<number> {
  let files;
  try {
    files = await api.list("memory", { files: true, directories: false });
  } catch {
    return 0;
  }
  const targets = files.filter((f) => f.name.endsWith(".md"));
  await Promise.all(targets.map((f) => api.delete(f.path).catch(() => {})));
  return targets.length;
}

/** Format memory entries into the system-prompt block (server-parity). */
export function formatMemoryContext(entries: MemoryEntry[]): string {
  if (entries.length === 0) return "";
  const body = entries.map((e) => `### ${e.key}\n${e.content}`).join("\n\n");
  return [
    "USER MEMORY (persisted notes about the user — consider these when responding):",
    body,
  ].join("\n");
}

export async function getMemoryContext(api: StorageApi): Promise<string> {
  return formatMemoryContext(await listMemoryEntries(api));
}

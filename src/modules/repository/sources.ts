/**
 * Isomorphic source (upload) storage over a `StorageApi`. Mirrors the on-disk
 * layout used by `server/lib/sources/store.ts`
 * (`sources/<id>/source.json`, `sources/<id>/extracted.txt`,
 * `sources/<id>/blob.<ext>`) so browser mode can own uploads in IndexedDB.
 *
 * The one deliberate divergence from the server filesystem layout: the blob is
 * stored **base64-encoded** because the IndexedDB adapter is text-only (see
 * `.features/browser-storage-mode.md` risk #7.1). Extraction itself still runs
 * server-side (parsing libs) via the stateless `/api/sources/extract` endpoint;
 * this module only persists the result.
 */

import type {
  Source,
  SourceScope,
  SourceHydrationPayload,
} from "@modules/core";
import type { StorageApi } from "@modules/storage/client";
import { storagePaths } from "@modules/storage/paths";

const BLOB_PREFIX = "blob.";

function sameScope(a: SourceScope, b: SourceScope): boolean {
  return a.courseId === b.courseId && a.lessonId === b.lessonId;
}

function matchesScope(source: Source, query?: SourceScope): boolean {
  if (!query?.courseId) return true;
  return source.scopes.some(
    (s) =>
      s.courseId === query.courseId &&
      (!query.lessonId ||
        s.lessonId === query.lessonId ||
        s.lessonId === undefined)
  );
}

async function readMeta(api: StorageApi, id: string): Promise<Source | null> {
  try {
    const res = await api.get<string>(storagePaths.sourceMeta(id));
    if (!res.ok) return null;
    return JSON.parse(await res.text()) as Source;
  } catch {
    return null;
  }
}

/** Persisted metadata never embeds the (potentially large) extracted text. */
async function writeMeta(api: StorageApi, source: Source): Promise<void> {
  const meta: Source = { ...source };
  delete meta.extractedText;
  await api.put(storagePaths.sourceMeta(source.id), JSON.stringify(meta, null, 2));
}

async function findBlobPath(
  api: StorageApi,
  id: string
): Promise<string | null> {
  let entries;
  try {
    entries = await api.list(storagePaths.sourceDir(id), {
      files: true,
      directories: false,
    });
  } catch {
    return null;
  }
  const blob = entries.find((e) => e.name.startsWith(BLOB_PREFIX));
  return blob ? blob.path : null;
}

export interface StoreSourceInput {
  metadata: Source;
  extractedText?: string;
  /** base64-encoded original bytes. */
  blobBase64: string;
  /** Extension the blob is stored under (`blob.<ext>`). */
  blobExt: string;
  scope?: SourceScope;
}

/**
 * Persist an extracted upload. Deduplicates by id (sha256 of the bytes): a
 * repeat upload reuses the stored blob and just merges the new scope/refCount,
 * mirroring the server `createSource`.
 */
export async function createSource(
  api: StorageApi,
  input: StoreSourceInput
): Promise<Source> {
  const { metadata, extractedText, blobBase64, blobExt, scope } = input;
  const id = metadata.id;
  const now = new Date().toISOString();

  const existing = await readMeta(api, id);
  if (existing) {
    if (scope && !existing.scopes.some((s) => sameScope(s, scope))) {
      existing.scopes.push(scope);
      existing.refCount = existing.scopes.length;
      existing.updatedAt = now;
      await writeMeta(api, existing);
    }
    return existing;
  }

  await api.put(storagePaths.sourceBlob(id, blobExt), blobBase64);
  if (extractedText) {
    await api.put(storagePaths.sourceText(id), extractedText);
  }

  const scopes = scope ? [scope] : [];
  const source: Source = {
    ...metadata,
    scopes,
    refCount: scopes.length,
  };
  await writeMeta(api, source);
  return source;
}

/** List source metadata (no extracted text), optionally filtered by scope. */
export async function listSources(
  api: StorageApi,
  query?: SourceScope
): Promise<Source[]> {
  let dirs;
  try {
    dirs = await api.list("sources", { files: false, directories: true });
  } catch {
    return [];
  }
  const metas = await Promise.all(dirs.map((d) => readMeta(api, d.name)));
  return metas
    .filter((m): m is Source => m !== null && matchesScope(m, query))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getSource(
  api: StorageApi,
  id: string
): Promise<Source | null> {
  return readMeta(api, id);
}

export async function getSourceText(
  api: StorageApi,
  id: string
): Promise<string | null> {
  try {
    const res = await api.get<string>(storagePaths.sourceText(id));
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export interface SourceBlobBase64 {
  base64: string;
  mimeType: string;
}

export async function getSourceBlob(
  api: StorageApi,
  id: string
): Promise<SourceBlobBase64 | null> {
  const meta = await readMeta(api, id);
  if (!meta) return null;
  const path = await findBlobPath(api, id);
  if (!path) return null;
  const res = await api.get<string>(path);
  if (!res.ok) return null;
  return {
    base64: await res.text(),
    mimeType: meta.mimeType ?? "application/octet-stream",
  };
}

/**
 * Detach a source from a scope. When no scopes remain (or no scope is given),
 * the source and its blob/text are deleted entirely.
 */
export async function deleteSource(
  api: StorageApi,
  id: string,
  scope?: SourceScope
): Promise<void> {
  const meta = await readMeta(api, id);
  if (!meta) return;

  if (scope) {
    meta.scopes = meta.scopes.filter((s) => !sameScope(s, scope));
    meta.refCount = meta.scopes.length;
    meta.updatedAt = new Date().toISOString();
    if (meta.scopes.length > 0) {
      await writeMeta(api, meta);
      return;
    }
  }
  await api.delete(storagePaths.sourceDir(id), true);
}

/**
 * Resolve ready sources into the payloads the chat endpoint hydrates from in
 * browser mode: extracted text for text sources, base64 bytes for native
 * (image/PDF) sources.
 */
export async function loadHydrationPayloads(
  api: StorageApi,
  ids: string[]
): Promise<SourceHydrationPayload[]> {
  const payloads = await Promise.all(
    ids.map(async (id): Promise<SourceHydrationPayload | null> => {
      const meta = await readMeta(api, id);
      if (!meta || meta.status !== "ready") return null;
      const payload: SourceHydrationPayload = {
        id: meta.id,
        kind: meta.kind,
        label: meta.label,
        status: meta.status,
        mimeType: meta.mimeType,
      };
      if (meta.kind === "image" || meta.kind === "pdf") {
        const blob = await getSourceBlob(api, id);
        if (blob) payload.blobBase64 = blob.base64;
      }
      if (meta.kind !== "image") {
        const text = await getSourceText(api, id);
        if (text) payload.extractedText = text;
      }
      return payload;
    })
  );
  return payloads.filter((p): p is SourceHydrationPayload => p !== null);
}

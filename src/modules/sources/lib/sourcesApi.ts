import type { Source, SourceScope, SourceHydrationPayload } from "@/modules/core";
import { getStorageMode } from "@/lib/runtimeConfig";
import { getLocalDataApi, isLocalDataAvailable } from "@/lib/localRepo";
import { sourceRepo } from "@modules/repository";

/** True when the browser's IndexedDB is the authoritative store. */
async function isBrowserMode(): Promise<boolean> {
  return (await getStorageMode()) === "browser";
}

function scopeQuery(scope?: SourceScope): string {
  const p = new URLSearchParams();
  if (scope?.courseId) p.set("courseId", scope.courseId);
  if (scope?.lessonId) p.set("lessonId", scope.lessonId);
  const s = p.toString();
  return s ? `?${s}` : "";
}

/** Chunked base64 of a byte array (avoids call-stack limits on large blobs). */
function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

export async function fetchSources(scope?: SourceScope): Promise<Source[]> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return [];
    return sourceRepo.listSources(getLocalDataApi(), scope);
  }
  const res = await fetch(`/api/sources${scopeQuery(scope)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.sources) ? (data.sources as Source[]) : [];
}

/** Shape returned by the stateless `/api/sources/extract` endpoint. */
interface ExtractedSource {
  metadata: Source;
  extractedText?: string;
  blobExt: string;
}

async function extractSources(files: File[]): Promise<ExtractedSource[]> {
  const form = new FormData();
  for (const f of files) form.append("file", f);
  const res = await fetch("/api/sources/extract", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data.results as ExtractedSource[];
}

export async function uploadSources(
  files: File[],
  scope?: SourceScope
): Promise<Source[]> {
  if (await isBrowserMode()) {
    const extracted = await extractSources(files);
    const api = getLocalDataApi();
    const created: Source[] = [];
    for (let i = 0; i < extracted.length; i++) {
      const { metadata, extractedText, blobExt } = extracted[i];
      const blobBase64 = toBase64(new Uint8Array(await files[i].arrayBuffer()));
      created.push(
        await sourceRepo.createSource(api, {
          metadata,
          extractedText,
          blobBase64,
          blobExt,
          scope: scope?.courseId || scope?.lessonId ? scope : undefined,
        })
      );
    }
    return created;
  }

  const form = new FormData();
  for (const f of files) form.append("file", f);
  if (scope?.courseId) form.append("courseId", scope.courseId);
  if (scope?.lessonId) form.append("lessonId", scope.lessonId);

  const res = await fetch("/api/sources", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return data.sources as Source[];
}

export async function deleteSource(
  id: string,
  scope?: SourceScope
): Promise<void> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return;
    await sourceRepo.deleteSource(getLocalDataApi(), id, scope);
    return;
  }
  await fetch(`/api/sources/${encodeURIComponent(id)}${scopeQuery(scope)}`, {
    method: "DELETE",
  });
}

/**
 * Resolve selected source ids into chat-hydration payloads. Only meaningful in
 * browser mode (the server has no filesystem to hydrate from); returns `[]` in
 * filesystem mode, where the server hydrates from disk using `sourceIds`.
 */
export async function loadSourceHydration(
  ids: string[]
): Promise<SourceHydrationPayload[]> {
  if (ids.length === 0) return [];
  if (!(await isBrowserMode()) || !isLocalDataAvailable()) return [];
  return sourceRepo.loadHydrationPayloads(getLocalDataApi(), ids);
}

/**
 * Blob URL for rendering an image source / previewing a file. In browser mode
 * this is an object URL built from the locally-stored blob (revoke it when
 * done); in filesystem mode it's the server endpoint.
 */
export async function resolveSourceBlobUrl(id: string): Promise<string | null> {
  if (await isBrowserMode()) {
    if (!isLocalDataAvailable()) return null;
    const blob = await sourceRepo.getSourceBlob(getLocalDataApi(), id);
    return blob ? base64ToBlobUrl(blob.base64, blob.mimeType) : null;
  }
  return `/api/sources/${encodeURIComponent(id)}/blob`;
}

/** Synchronous endpoint URL (filesystem mode only). */
export function sourceBlobUrl(id: string): string {
  return `/api/sources/${encodeURIComponent(id)}/blob`;
}

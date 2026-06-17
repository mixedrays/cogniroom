import type { Source, SourceScope } from "@/modules/core";

function scopeQuery(scope?: SourceScope): string {
  const p = new URLSearchParams();
  if (scope?.courseId) p.set("courseId", scope.courseId);
  if (scope?.lessonId) p.set("lessonId", scope.lessonId);
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchSources(scope?: SourceScope): Promise<Source[]> {
  const res = await fetch(`/api/sources${scopeQuery(scope)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.sources) ? (data.sources as Source[]) : [];
}

export async function uploadSources(
  files: File[],
  scope?: SourceScope
): Promise<Source[]> {
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
  await fetch(`/api/sources/${encodeURIComponent(id)}${scopeQuery(scope)}`, {
    method: "DELETE",
  });
}

/** Blob URL for rendering an image source / previewing a file. */
export function sourceBlobUrl(id: string): string {
  return `/api/sources/${encodeURIComponent(id)}/blob`;
}

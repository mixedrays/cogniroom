import { createHash } from "node:crypto";
import { join } from "node:path";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  rm,
  access,
} from "node:fs/promises";
import type { Source, SourceScope } from "@modules/core";
import { SOURCES_DIR, getSourceDir } from "@root/server/env";
import { classifyUpload, processSource } from "./processors";

const META_FILE = "source.json";
const TEXT_FILE = "extracted.txt";

const EXT_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "text/plain": "txt",
  "text/markdown": "md",
};

function blobExt(filename: string, mimeType?: string): string {
  const fromName = filename.includes(".")
    ? filename.toLowerCase().split(".").pop() ?? ""
    : "";
  if (fromName) return fromName;
  return EXT_BY_MIME[(mimeType ?? "").toLowerCase()] ?? "bin";
}

function sameScope(a: SourceScope, b: SourceScope): boolean {
  return a.courseId === b.courseId && a.lessonId === b.lessonId;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/** Persisted metadata never embeds the (potentially large) extracted text. */
async function writeMeta(source: Source): Promise<void> {
  const meta: Source = { ...source };
  delete meta.extractedText;
  await writeFile(
    join(getSourceDir(source.id), META_FILE),
    JSON.stringify(meta, null, 2),
    "utf8"
  );
}

async function readMeta(id: string): Promise<Source | null> {
  try {
    const raw = await readFile(join(getSourceDir(id), META_FILE), "utf8");
    return JSON.parse(raw) as Source;
  } catch {
    return null;
  }
}

export interface ExtractSourceInput {
  bytes: Buffer;
  filename: string;
  mimeType?: string;
}

/** Result of extracting an upload without persisting it (browser mode). */
export interface ExtractedSource {
  /** Metadata with no scopes assigned yet — the caller owns scope/refCount. */
  metadata: Source;
  extractedText?: string;
  /** Extension the blob is stored under (`blob.<ext>`). */
  blobExt: string;
}

/**
 * Classify + process an upload's bytes into a `Source` metadata record and its
 * extracted text, WITHOUT touching the filesystem. Shared by `createSource`
 * (filesystem persistence) and the stateless extract endpoint (browser mode,
 * where the client persists into IndexedDB).
 */
export async function extractSource(
  input: ExtractSourceInput
): Promise<ExtractedSource> {
  const { bytes, filename, mimeType } = input;
  const id = createHash("sha256").update(bytes).digest("hex");
  const now = new Date().toISOString();
  const kind = classifyUpload(filename, mimeType);
  const ext = blobExt(filename, mimeType);
  const result = await processSource(kind, { bytes, filename, mimeType });

  const metadata: Source = {
    id,
    kind,
    origin: "upload",
    delivery: result.delivery,
    label: filename,
    source: filename,
    mimeType,
    byteSize: bytes.byteLength,
    status: result.status,
    error: result.error,
    extractedTokens: result.extractedTokens,
    meta: result.meta,
    scopes: [],
    refCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  return { metadata, extractedText: result.extractedText, blobExt: ext };
}

export interface CreateSourceInput {
  bytes: Buffer;
  filename: string;
  mimeType?: string;
  scope?: SourceScope;
}

/**
 * Store an uploaded file as a Source. Deduplicates by sha256 of the bytes: a
 * repeat upload reuses the existing blob and just adds the new scope/refCount.
 */
export async function createSource(input: CreateSourceInput): Promise<Source> {
  const { bytes, scope } = input;
  const id = createHash("sha256").update(bytes).digest("hex");
  const dir = getSourceDir(id);
  const now = new Date().toISOString();

  const existing = await readMeta(id);
  if (existing) {
    if (scope && !existing.scopes.some((s) => sameScope(s, scope))) {
      existing.scopes.push(scope);
      existing.refCount = existing.scopes.length;
      existing.updatedAt = now;
      await writeMeta(existing);
    }
    return existing;
  }

  await mkdir(dir, { recursive: true });

  const { metadata, extractedText, blobExt: ext } = await extractSource(input);
  await writeFile(join(dir, `blob.${ext}`), bytes);
  if (extractedText) {
    await writeFile(join(dir, TEXT_FILE), extractedText, "utf8");
  }

  const scopes = scope ? [scope] : [];
  const source: Source = {
    ...metadata,
    scopes,
    refCount: scopes.length,
  };
  await writeMeta(source);
  return source;
}

function matchesScope(source: Source, query?: SourceScope): boolean {
  if (!query?.courseId) return true;
  return source.scopes.some(
    (s) =>
      s.courseId === query.courseId &&
      (!query.lessonId || s.lessonId === query.lessonId || s.lessonId === undefined)
  );
}

/** List source metadata (no extracted text), optionally filtered by scope. */
export async function listSources(query?: SourceScope): Promise<Source[]> {
  let ids: string[];
  try {
    ids = await readdir(SOURCES_DIR);
  } catch {
    return [];
  }
  const metas = await Promise.all(ids.map((id) => readMeta(id)));
  return metas
    .filter((m): m is Source => m !== null && matchesScope(m, query))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getSource(id: string): Promise<Source | null> {
  return readMeta(id);
}

export async function getSourceText(id: string): Promise<string | null> {
  try {
    return await readFile(join(getSourceDir(id), TEXT_FILE), "utf8");
  } catch {
    return null;
  }
}

export interface SourceBlob {
  bytes: Buffer;
  mimeType: string;
}

export async function getSourceBlob(id: string): Promise<SourceBlob | null> {
  const meta = await readMeta(id);
  if (!meta) return null;
  const dir = getSourceDir(id);
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const blobName = entries.find((e) => e.startsWith("blob."));
  if (!blobName) return null;
  try {
    const bytes = await readFile(join(dir, blobName));
    return { bytes, mimeType: meta.mimeType ?? "application/octet-stream" };
  } catch {
    return null;
  }
}

/**
 * Detach a source from a scope. When no scopes remain (or no scope is given),
 * the source and its blob are deleted entirely.
 */
export async function deleteSource(
  id: string,
  scope?: SourceScope
): Promise<void> {
  const dir = getSourceDir(id);
  if (!(await exists(dir))) return;

  if (scope) {
    const meta = await readMeta(id);
    if (meta) {
      meta.scopes = meta.scopes.filter((s) => !sameScope(s, scope));
      meta.refCount = meta.scopes.length;
      meta.updatedAt = new Date().toISOString();
      if (meta.scopes.length > 0) {
        await writeMeta(meta);
        return;
      }
    }
  }
  await rm(dir, { recursive: true, force: true });
}

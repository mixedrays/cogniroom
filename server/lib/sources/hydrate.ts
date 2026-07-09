import type { ModelMessage, FilePart, ImagePart, TextPart } from "ai";
import type { Source, SourceHydrationPayload } from "@modules/core";
import { getModelCapabilities } from "@/lib/llm-models";
import { getSource, getSourceBlob, getSourceText } from "./store";
import type { SourceBlob } from "./store";

type UserPart = TextPart | ImagePart | FilePart;

/**
 * The subset of source access `hydrateSources` needs. In filesystem mode this
 * reads from disk (`store.ts`); in browser mode the client ships the resolved
 * data in the request and `clientSourceResolver` serves it from memory.
 */
export interface SourceResolver {
  getSource(id: string): Promise<Source | null>;
  getSourceText(id: string): Promise<string | null>;
  getSourceBlob(id: string): Promise<SourceBlob | null>;
}

const fsResolver: SourceResolver = {
  getSource,
  getSourceText,
  getSourceBlob,
};

/**
 * Build a resolver over client-supplied hydration payloads (browser mode). Text
 * sources carry `extractedText`; native image/PDF sources carry `blobBase64`.
 */
export function clientSourceResolver(
  payloads: SourceHydrationPayload[]
): SourceResolver {
  const byId = new Map(payloads.map((p) => [p.id, p]));
  const toSource = (p: SourceHydrationPayload): Source => ({
    id: p.id,
    kind: p.kind,
    origin: "upload",
    delivery: p.kind === "image" || p.kind === "pdf" ? "native" : "text",
    label: p.label,
    source: p.label,
    mimeType: p.mimeType,
    status: p.status,
    scopes: [],
    refCount: 0,
    createdAt: "",
    updatedAt: "",
  });
  return {
    async getSource(id) {
      const p = byId.get(id);
      return p ? toSource(p) : null;
    },
    async getSourceText(id) {
      return byId.get(id)?.extractedText ?? null;
    },
    async getSourceBlob(id) {
      const p = byId.get(id);
      if (!p?.blobBase64) return null;
      return {
        bytes: Buffer.from(p.blobBase64, "base64"),
        mimeType: p.mimeType ?? "application/octet-stream",
      };
    },
  };
}

function findLastUserIndex(messages: ModelMessage[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

function attachmentBlock(label: string, text: string): TextPart {
  return { type: "text", text: `<attachment label="${label}">\n${text}\n</attachment>` };
}

/**
 * Append attached sources onto the last user message. Native sources
 * (images/PDFs) become multimodal parts when the model supports them; text
 * sources (documents, web/youtube, and unsupported-native fallbacks) become
 * `<attachment>` text parts loaded from disk. This is the single hydration
 * point — clients only send source ids. See .features/chat-attachments.md.
 */
export async function hydrateSources(
  messages: ModelMessage[],
  sourceIds: string[] | undefined,
  modelId: string,
  resolver: SourceResolver = fsResolver
): Promise<ModelMessage[]> {
  if (!sourceIds || sourceIds.length === 0) return messages;

  const caps = getModelCapabilities(modelId);
  const extraParts: UserPart[] = [];

  for (const id of sourceIds) {
    const meta = await resolver.getSource(id);
    if (!meta || meta.status !== "ready") continue;

    if (meta.kind === "image") {
      if (!caps.vision) {
        extraParts.push({
          type: "text",
          text: `[Image "${meta.label}" omitted: the selected model has no vision support]`,
        });
        continue;
      }
      const blob = await resolver.getSourceBlob(id);
      if (!blob) continue;
      extraParts.push({
        type: "image",
        image: new Uint8Array(blob.bytes),
        mediaType: blob.mimeType,
      });
      continue;
    }

    if (meta.kind === "pdf" && caps.pdf) {
      const blob = await resolver.getSourceBlob(id);
      if (!blob) continue;
      extraParts.push({
        type: "file",
        data: new Uint8Array(blob.bytes),
        mediaType: "application/pdf",
        filename: meta.label,
      });
      continue;
    }

    // Text delivery: documents, web/youtube (future), and the pdf fallback for
    // models without native PDF support.
    const text = await resolver.getSourceText(id);
    if (text) {
      extraParts.push(attachmentBlock(meta.label, text));
    } else if (meta.kind === "pdf") {
      extraParts.push({
        type: "text",
        text: `[PDF "${meta.label}" omitted: the selected model has no PDF support]`,
      });
    }
  }

  if (extraParts.length === 0) return messages;

  const idx = findLastUserIndex(messages);
  if (idx < 0) return messages;

  const target = messages[idx];
  const parts: UserPart[] = [];
  if (typeof target.content === "string") {
    if (target.content) parts.push({ type: "text", text: target.content });
  } else if (Array.isArray(target.content)) {
    parts.push(...(target.content as UserPart[]));
  }
  parts.push(...extraParts);

  const next = messages.slice();
  next[idx] = { role: "user", content: parts };
  return next;
}

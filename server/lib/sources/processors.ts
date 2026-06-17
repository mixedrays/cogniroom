import type { SourceDelivery, SourceKind, SourceMeta } from "@modules/core";

/**
 * Result of turning a stored source's bytes/url into something the model can
 * consume — either a native multimodal part (kept on disk as the blob) or
 * extracted text. See .features/chat-attachments.md.
 */
export interface ProcessResult {
  delivery: SourceDelivery;
  extractedText?: string;
  extractedTokens?: number;
  meta?: SourceMeta;
  status: "ready" | "error";
  error?: string;
}

export interface ProcessInput {
  bytes: Buffer;
  filename: string;
  mimeType?: string;
  url?: string;
}

export type SourceProcessor = (input: ProcessInput) => Promise<ProcessResult>;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Decide which kind an uploaded file is from its mime type / extension. */
export function classifyUpload(filename: string, mimeType?: string): SourceKind {
  const mime = (mimeType ?? "").toLowerCase();
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"].includes(ext)) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime === DOCX_MIME || ext === "docx" || ext === "doc") return "document";
  // txt/md/markdown and anything text-like falls back to plain text.
  return "text";
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const imageProcessor: SourceProcessor = async () => ({
  delivery: "native",
  status: "ready",
});

const pdfProcessor: SourceProcessor = async ({ bytes }) => {
  // Delivered natively (Claude reads PDFs directly); also extract text as a
  // fallback for non-multimodal models. A failed extraction is non-fatal.
  try {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const doc = await getDocumentProxy(new Uint8Array(bytes));
    const { text, totalPages } = await extractText(doc, { mergePages: true });
    const merged = Array.isArray(text) ? text.join("\n\n") : text;
    return {
      delivery: "native",
      status: "ready",
      extractedText: merged || undefined,
      meta: { pageCount: totalPages },
    };
  } catch {
    return { delivery: "native", status: "ready" };
  }
};

const documentProcessor: SourceProcessor = async ({ bytes, filename }) => {
  const ext = filename.toLowerCase().split(".").pop() ?? "";
  if (ext === "docx" || ext === "doc") {
    try {
      const mammoth = await import("mammoth");
      const { value } = await mammoth.extractRawText({ buffer: bytes });
      const text = value.trim();
      if (!text) {
        return { delivery: "text", status: "error", error: "No text found in document" };
      }
      return {
        delivery: "text",
        status: "ready",
        extractedText: text,
        extractedTokens: estimateTokens(text),
      };
    } catch (e) {
      return {
        delivery: "text",
        status: "error",
        error: e instanceof Error ? e.message : "Failed to read document",
      };
    }
  }
  // Unknown document extension: treat bytes as utf-8 text.
  return textProcessor({ bytes, filename });
};

const textProcessor: SourceProcessor = async ({ bytes }) => {
  const text = bytes.toString("utf8").trim();
  if (!text) {
    return { delivery: "text", status: "error", error: "Empty text source" };
  }
  return { delivery: "text", status: "ready", extractedText: text };
};

// Phase 2 stubs — kind exists so wiring them later is purely additive.
const notYetSupported = (kind: SourceKind): SourceProcessor => async () => ({
  delivery: "text",
  status: "error",
  error: `Source type "${kind}" is not supported yet`,
});

export const sourceProcessors: Record<SourceKind, SourceProcessor> = {
  image: imageProcessor,
  pdf: pdfProcessor,
  document: documentProcessor,
  text: textProcessor,
  webpage: notYetSupported("webpage"),
  youtube: notYetSupported("youtube"),
};

export async function processSource(
  kind: SourceKind,
  input: ProcessInput
): Promise<ProcessResult> {
  const result = await sourceProcessors[kind](input);
  if (result.extractedText && result.extractedTokens === undefined) {
    result.extractedTokens = estimateTokens(result.extractedText);
  }
  return result;
}

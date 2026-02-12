/**
 * Abstract base class for storage adapters
 * Defines the interface that all storage backends must implement
 */

import type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageRequest,
  StorageResponse,
  StorageStatusCode,
} from "../types";
import { StorageStatus, StorageStatusText } from "../types";

export abstract class StorageAdapter {
  protected config: StorageConfig;

  constructor(config: StorageConfig = {}) {
    this.config = {
      basePath: config.basePath ?? process.cwd(),
      defaultEncoding: config.defaultEncoding ?? "utf-8",
      ...config,
    };
  }

  /**
   * Execute a storage request and return a response
   * This is the main entry point for all storage operations
   */
  abstract execute<T>(request: StorageRequest): Promise<StorageResponse<T>>;

  /**
   * List contents of a directory
   */
  abstract list(path: string, options?: ListOptions): Promise<FileMetadata[]>;

  /**
   * Get metadata for a file or directory
   */
  abstract stat(path: string): Promise<FileMetadata | null>;

  /**
   * Check if a path exists
   */
  abstract exists(path: string): Promise<boolean>;

  /**
   * Helper to create a consistent response object
   */
  protected createResponse<T>(
    status: StorageStatusCode,
    data?: T,
    rawText?: string
  ): StorageResponse<T> {
    const ok = status >= 200 && status < 300;
    const storedData = data;
    const storedText = rawText ?? (data !== undefined ? JSON.stringify(data) : "");

    return {
      ok,
      status,
      statusText: StorageStatusText[status] ?? "Unknown",
      data: storedData,
      async json<R = T>(): Promise<R> {
        if (storedData !== undefined) {
          return storedData as unknown as R;
        }
        if (storedText) {
          return JSON.parse(storedText) as R;
        }
        throw new Error("No data available");
      },
      async text(): Promise<string> {
        return storedText;
      },
    };
  }

  /**
   * Helper to create an error response
   */
  protected createErrorResponse<T>(
    status: StorageStatusCode,
    message?: string
  ): StorageResponse<T> {
    return {
      ok: false,
      status,
      statusText: message ?? StorageStatusText[status] ?? "Unknown Error",
      async json<R>(): Promise<R> {
        throw new Error(message ?? "Request failed");
      },
      async text(): Promise<string> {
        return message ?? "";
      },
    };
  }

  /**
   * Detect content type from file extension
   */
  protected getContentType(
    path: string
  ): "application/json" | "text/markdown" | "text/plain" | "application/octet-stream" {
    const ext = path.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "json":
        return "application/json";
      case "md":
      case "markdown":
        return "text/markdown";
      case "txt":
      case "text":
        return "text/plain";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Map system errors to HTTP-like status codes
   */
  protected mapErrorToStatus(error: NodeJS.ErrnoException): StorageStatusCode {
    switch (error.code) {
      case "ENOENT":
        return StorageStatus.NOT_FOUND;
      case "EACCES":
      case "EPERM":
        return StorageStatus.FORBIDDEN;
      case "EEXIST":
        return StorageStatus.CONFLICT;
      case "EISDIR":
      case "ENOTDIR":
        return StorageStatus.BAD_REQUEST;
      default:
        return StorageStatus.INTERNAL_ERROR;
    }
  }
}

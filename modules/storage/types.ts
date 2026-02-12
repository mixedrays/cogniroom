/**
 * Storage module type definitions
 * Provides fetch()-compatible interfaces for storage operations
 */

// HTTP-like method types for storage operations
export type StorageMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD";

// Content type detection based on file extension
export type StorageContentType =
  | "application/json"
  | "text/markdown"
  | "text/plain"
  | "application/octet-stream";

// Request initialization options (mimics RequestInit)
export interface StorageInit {
  method?: StorageMethod;
  body?: string | object;
  headers?: Record<string, string>;
  options?: StorageOptions;
}

// Additional options for storage operations
export interface StorageOptions {
  /** Create parent directories if they don't exist (default: true for POST/PUT) */
  createParents?: boolean;
  /** Delete directories recursively (for DELETE operations) */
  recursive?: boolean;
  /** Encoding for text files (default: utf-8) */
  encoding?: BufferEncoding;
}

// Response interface (mimics Response)
export interface StorageResponse<T = unknown> {
  /** True if status is 200-299 */
  ok: boolean;
  /** HTTP-like status code */
  status: number;
  /** Status description */
  statusText: string;
  /** Parsed data (for successful GET operations) */
  data?: T;
  /** Parse response as JSON */
  json<R = T>(): Promise<R>;
  /** Get response as text */
  text(): Promise<string>;
}

// Configuration for storage adapter initialization
export interface StorageConfig {
  /** Base path for storage operations */
  basePath?: string;
  /** Default encoding for text files */
  defaultEncoding?: BufferEncoding;
  /** Adapter type identifier */
  adapter?: "filesystem" | "database" | "localstorage";
}

// Options for listing directory contents
export interface ListOptions {
  /** Include files in listing (default: true) */
  files?: boolean;
  /** Include directories in listing (default: true) */
  directories?: boolean;
  /** Recursively list contents */
  recursive?: boolean;
  /** Filter by file extension (e.g., '.json', '.md') */
  extension?: string;
}

// File/directory metadata
export interface FileMetadata {
  /** File or directory name */
  name: string;
  /** Full path relative to storage base */
  path: string;
  /** True if this is a directory */
  isDirectory: boolean;
  /** File size in bytes (0 for directories) */
  size: number;
  /** Last modified timestamp */
  modifiedAt: Date;
  /** Created timestamp */
  createdAt: Date;
}

// Internal request representation
export interface StorageRequest {
  /** Relative path to resource */
  path: string;
  /** HTTP-like method */
  method: StorageMethod;
  /** Request body (for POST/PUT) */
  body?: string | object;
  /** Request headers */
  headers: Record<string, string>;
  /** Additional options */
  options: StorageOptions;
}

// Status code mappings
export const StorageStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export type StorageStatusCode =
  (typeof StorageStatus)[keyof typeof StorageStatus];

// Status text mappings
export const StorageStatusText: Record<StorageStatusCode, string> = {
  [StorageStatus.OK]: "OK",
  [StorageStatus.CREATED]: "Created",
  [StorageStatus.NO_CONTENT]: "No Content",
  [StorageStatus.BAD_REQUEST]: "Bad Request",
  [StorageStatus.NOT_FOUND]: "Not Found",
  [StorageStatus.FORBIDDEN]: "Forbidden",
  [StorageStatus.CONFLICT]: "Conflict",
  [StorageStatus.INTERNAL_ERROR]: "Internal Server Error",
};

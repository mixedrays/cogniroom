/**
 * Filesystem storage adapter
 * Implements storage operations using Node.js fs/promises
 */

import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageRequest,
  StorageResponse,
} from "../types";
import { StorageStatus } from "../types";
import { StorageAdapter } from "./base";

export class FileSystemAdapter extends StorageAdapter {
  constructor(config: StorageConfig = {}) {
    super(config);
  }

  /**
   * Resolve a relative path to an absolute path
   */
  private resolvePath(relativePath: string): string {
    // Remove leading slash if present
    const cleanPath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;
    return join(this.config.basePath!, cleanPath);
  }

  /**
   * Execute a storage request
   */
  async execute<T>(request: StorageRequest): Promise<StorageResponse<T>> {
    const fullPath = this.resolvePath(request.path);

    try {
      switch (request.method) {
        case "GET":
          return await this.handleGet<T>(fullPath, request);
        case "POST":
        case "PUT":
          return await this.handleWrite<T>(fullPath, request);
        case "DELETE":
          return await this.handleDelete<T>(fullPath, request);
        case "HEAD":
          return await this.handleHead<T>(fullPath);
        default:
          return this.createErrorResponse(
            StorageStatus.BAD_REQUEST,
            `Unsupported method: ${request.method}`
          );
      }
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      const status = this.mapErrorToStatus(nodeError);
      return this.createErrorResponse(status, nodeError.message);
    }
  }

  /**
   * Handle GET requests - read file contents
   */
  private async handleGet<T>(
    fullPath: string,
    request: StorageRequest
  ): Promise<StorageResponse<T>> {
    const encoding = request.options.encoding ?? this.config.defaultEncoding ?? "utf-8";
    const content = await readFile(fullPath, { encoding });
    const contentType = this.getContentType(fullPath);

    // Auto-parse JSON files
    if (contentType === "application/json") {
      const parsed = JSON.parse(content) as T;
      return this.createResponse(StorageStatus.OK, parsed, content);
    }

    return this.createResponse(StorageStatus.OK, content as unknown as T, content);
  }

  /**
   * Handle POST/PUT requests - write file contents
   */
  private async handleWrite<T>(
    fullPath: string,
    request: StorageRequest
  ): Promise<StorageResponse<T>> {
    // Create parent directories if needed (default: true)
    const createParents = request.options.createParents ?? true;
    if (createParents) {
      await mkdir(dirname(fullPath), { recursive: true });
    }

    // Prepare content
    let content: string;
    if (typeof request.body === "object") {
      content = JSON.stringify(request.body, null, 2);
    } else if (typeof request.body === "string") {
      content = request.body;
    } else {
      return this.createErrorResponse(
        StorageStatus.BAD_REQUEST,
        "Request body is required for POST/PUT"
      );
    }

    const encoding = request.options.encoding ?? this.config.defaultEncoding ?? "utf-8";
    await writeFile(fullPath, content, { encoding });

    // Check if file existed before (for status code)
    // POST creates new (201), PUT updates (200)
    // For simplicity, we return 201 for POST and 200 for PUT
    const status = request.method === "POST" ? StorageStatus.CREATED : StorageStatus.OK;
    return this.createResponse(status);
  }

  /**
   * Handle DELETE requests - remove file or directory
   */
  private async handleDelete<T>(
    fullPath: string,
    request: StorageRequest
  ): Promise<StorageResponse<T>> {
    const recursive = request.options.recursive ?? false;
    await rm(fullPath, { recursive, force: false });
    return this.createResponse(StorageStatus.NO_CONTENT);
  }

  /**
   * Handle HEAD requests - check existence
   */
  private async handleHead<T>(fullPath: string): Promise<StorageResponse<T>> {
    try {
      await stat(fullPath);
      return this.createResponse(StorageStatus.OK);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return this.createErrorResponse(StorageStatus.NOT_FOUND);
      }
      throw error;
    }
  }

  /**
   * List directory contents
   */
  async list(path: string, options: ListOptions = {}): Promise<FileMetadata[]> {
    const fullPath = this.resolvePath(path);
    const { files = true, directories = true, recursive = false, extension } = options;

    const entries = await readdir(fullPath, { withFileTypes: true });
    const results: FileMetadata[] = [];

    for (const entry of entries) {
      const entryPath = join(path, entry.name);
      const entryFullPath = join(fullPath, entry.name);

      const isDir = entry.isDirectory();

      // Filter by type
      if (isDir && !directories) continue;
      if (!isDir && !files) continue;

      // Filter by extension
      if (extension && !isDir && !entry.name.endsWith(extension)) continue;

      // Get metadata
      const stats = await stat(entryFullPath);
      const metadata: FileMetadata = {
        name: entry.name,
        path: entryPath,
        isDirectory: isDir,
        size: isDir ? 0 : stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.birthtime,
      };

      results.push(metadata);

      // Recurse into directories
      if (recursive && isDir) {
        const subEntries = await this.list(entryPath, options);
        results.push(...subEntries);
      }
    }

    return results;
  }

  /**
   * Get file/directory metadata
   */
  async stat(path: string): Promise<FileMetadata | null> {
    const fullPath = this.resolvePath(path);

    try {
      const stats = await stat(fullPath);
      const name = path.split("/").pop() ?? path;

      return {
        name,
        path,
        isDirectory: stats.isDirectory(),
        size: stats.isDirectory() ? 0 : stats.size,
        modifiedAt: stats.mtime,
        createdAt: stats.birthtime,
      };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    const fullPath = this.resolvePath(path);

    try {
      await stat(fullPath);
      return true;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return false;
      }
      throw error;
    }
  }
}

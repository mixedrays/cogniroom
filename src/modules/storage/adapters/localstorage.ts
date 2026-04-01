/**
 * LocalStorage adapter (stub)
 * Future implementation for browser-based storage
 */

import type {
  FileMetadata,
  ListOptions,
  StorageConfig,
  StorageRequest,
  StorageResponse,
} from "../types";
import { StorageStatus } from "../types";
import { StorageAdapter } from "./base";

export class LocalStorageAdapter extends StorageAdapter {
  constructor(config: StorageConfig = {}) {
    super({ ...config, adapter: "localstorage" });
  }

  async execute<T>(_request: StorageRequest): Promise<StorageResponse<T>> {
    return this.createErrorResponse(
      StorageStatus.INTERNAL_ERROR,
      "LocalStorageAdapter not implemented. Use FileSystemAdapter for server-side storage."
    );
  }

  async list(_path: string, _options?: ListOptions): Promise<FileMetadata[]> {
    throw new Error("LocalStorageAdapter.list() not implemented");
  }

  async stat(_path: string): Promise<FileMetadata | null> {
    throw new Error("LocalStorageAdapter.stat() not implemented");
  }

  async exists(_path: string): Promise<boolean> {
    throw new Error("LocalStorageAdapter.exists() not implemented");
  }
}

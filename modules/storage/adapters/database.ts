/**
 * Database storage adapter (stub)
 * Future implementation will use Drizzle ORM with PostgreSQL
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

export class DatabaseAdapter extends StorageAdapter {
  constructor(config: StorageConfig = {}) {
    super({ ...config, adapter: "database" });
  }

  async execute<T>(_request: StorageRequest): Promise<StorageResponse<T>> {
    return this.createErrorResponse(
      StorageStatus.INTERNAL_ERROR,
      "DatabaseAdapter not implemented. Use FileSystemAdapter for now."
    );
  }

  async list(_path: string, _options?: ListOptions): Promise<FileMetadata[]> {
    throw new Error("DatabaseAdapter.list() not implemented");
  }

  async stat(_path: string): Promise<FileMetadata | null> {
    throw new Error("DatabaseAdapter.stat() not implemented");
  }

  async exists(_path: string): Promise<boolean> {
    throw new Error("DatabaseAdapter.exists() not implemented");
  }
}

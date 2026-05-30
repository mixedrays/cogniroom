/**
 * IndexedDB storage adapter
 *
 * Implements the StorageAdapter contract using a single object store keyed by
 * path. Paths are treated as filesystem-style strings (e.g.
 * "courses/abc/course.md") and listing simulates directories by matching
 * unique path prefixes.
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

interface StoredRecord {
  path: string;
  content: string;
  contentType: string;
  size: number;
  createdAt: number;
  modifiedAt: number;
}

const DEFAULT_DB_NAME = "cogniroom-storage";
const DEFAULT_STORE_NAME = "entries";

function normalizePath(path: string): string {
  let p = path;
  if (p.startsWith("/")) p = p.slice(1);
  while (p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function parentPrefix(path: string): string {
  const normalized = normalizePath(path);
  if (!normalized) return "";
  return normalized + "/";
}

export class IndexedDBAdapter extends StorageAdapter {
  private readonly databaseName: string;
  private readonly storeName: string;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(config: StorageConfig = {}) {
    super({ ...config, adapter: "indexeddb" });
    this.databaseName = config.databaseName ?? DEFAULT_DB_NAME;
    this.storeName = config.storeName ?? DEFAULT_STORE_NAME;
  }

  private getDb(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        if (typeof indexedDB === "undefined") {
          reject(new Error("IndexedDB is not available in this environment"));
          return;
        }
        const request = indexedDB.open(this.databaseName, 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: "path" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  private async run<T>(
    mode: IDBTransactionMode,
    action: (store: IDBObjectStore) => IDBRequest<T> | T
  ): Promise<T> {
    const db = await this.getDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(this.storeName, mode);
      const store = tx.objectStore(this.storeName);
      let value: T | undefined;
      let resolved = false;
      const result = action(store);

      if (result && typeof result === "object" && "onsuccess" in result) {
        const req = result as IDBRequest<T>;
        req.onsuccess = () => {
          value = req.result;
          resolved = true;
        };
        req.onerror = () => reject(req.error);
      } else {
        value = result as T;
        resolved = true;
      }

      tx.oncomplete = () => {
        if (resolved) resolve(value as T);
        else reject(new Error("Transaction completed before request resolved"));
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    });
  }

  async execute<T>(request: StorageRequest): Promise<StorageResponse<T>> {
    const path = normalizePath(request.path);

    try {
      switch (request.method) {
        case "GET":
          return await this.handleGet<T>(path);
        case "POST":
        case "PUT":
          return await this.handleWrite<T>(path, request);
        case "DELETE":
          return await this.handleDelete<T>(path, request);
        case "HEAD":
          return await this.handleHead<T>(path);
        default:
          return this.createErrorResponse(
            StorageStatus.BAD_REQUEST,
            `Unsupported method: ${request.method}`
          );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return this.createErrorResponse(StorageStatus.INTERNAL_ERROR, message);
    }
  }

  private async handleGet<T>(path: string): Promise<StorageResponse<T>> {
    const record = (await this.run("readonly", (store) => store.get(path))) as
      | StoredRecord
      | undefined;

    if (!record) {
      return this.createErrorResponse(StorageStatus.NOT_FOUND);
    }

    const contentType = this.getContentType(path);
    if (contentType === "application/json") {
      try {
        const parsed = JSON.parse(record.content) as T;
        return this.createResponse(StorageStatus.OK, parsed, record.content);
      } catch {
        return this.createResponse(
          StorageStatus.OK,
          record.content as unknown as T,
          record.content
        );
      }
    }
    return this.createResponse(
      StorageStatus.OK,
      record.content as unknown as T,
      record.content
    );
  }

  private async handleWrite<T>(
    path: string,
    request: StorageRequest
  ): Promise<StorageResponse<T>> {
    let content: string;
    if (typeof request.body === "object" && request.body !== null) {
      content = JSON.stringify(request.body);
    } else if (typeof request.body === "string") {
      content = request.body;
    } else {
      return this.createErrorResponse(
        StorageStatus.BAD_REQUEST,
        "Request body is required for POST/PUT"
      );
    }

    const now = Date.now();
    const existing = (await this.run("readonly", (store) =>
      store.get(path)
    )) as StoredRecord | undefined;

    const record: StoredRecord = {
      path,
      content,
      contentType: this.getContentType(path),
      size: content.length,
      createdAt: existing?.createdAt ?? now,
      modifiedAt: now,
    };

    await this.run("readwrite", (store) => store.put(record));

    const status =
      request.method === "POST" ? StorageStatus.CREATED : StorageStatus.OK;
    return this.createResponse(status);
  }

  private async handleDelete<T>(
    path: string,
    request: StorageRequest
  ): Promise<StorageResponse<T>> {
    const recursive = request.options.recursive ?? false;
    const existing = (await this.run("readonly", (store) =>
      store.get(path)
    )) as StoredRecord | undefined;

    if (recursive) {
      const prefix = parentPrefix(path);
      const keysToDelete = await this.getKeysWithPrefix(prefix);
      const allKeys = existing ? [path, ...keysToDelete] : keysToDelete;
      if (allKeys.length === 0) {
        return this.createErrorResponse(StorageStatus.NOT_FOUND);
      }
      await this.bulkDelete(allKeys);
      return this.createResponse(StorageStatus.NO_CONTENT);
    }

    if (!existing) {
      return this.createErrorResponse(StorageStatus.NOT_FOUND);
    }
    await this.run("readwrite", (store) => store.delete(path));
    return this.createResponse(StorageStatus.NO_CONTENT);
  }

  private async handleHead<T>(path: string): Promise<StorageResponse<T>> {
    const exists = await this.exists(path);
    return exists
      ? this.createResponse(StorageStatus.OK)
      : this.createErrorResponse(StorageStatus.NOT_FOUND);
  }

  private async bulkDelete(keys: string[]): Promise<void> {
    const db = await this.getDb();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, "readwrite");
      const store = tx.objectStore(this.storeName);
      for (const key of keys) {
        store.delete(key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
    });
  }

  private async getAllKeys(): Promise<string[]> {
    return (await this.run("readonly", (store) =>
      store.getAllKeys()
    )) as unknown as string[];
  }

  private async getKeysWithPrefix(prefix: string): Promise<string[]> {
    const keys = await this.getAllKeys();
    return keys.filter((k) => k.startsWith(prefix));
  }

  async list(path: string, options: ListOptions = {}): Promise<FileMetadata[]> {
    const {
      files = true,
      directories = true,
      recursive = false,
      extension,
    } = options;

    const prefix = parentPrefix(path);
    const allKeys = await this.getAllKeys();
    const children = allKeys.filter((k) => k.startsWith(prefix));

    const filesMap = new Map<string, StoredRecord>();
    const dirSet = new Set<string>();

    for (const key of children) {
      const relative = key.slice(prefix.length);
      if (!relative) continue;
      const firstSlash = relative.indexOf("/");
      if (firstSlash === -1) {
        if (!files) continue;
        if (extension && !key.endsWith(extension)) continue;
        const record = (await this.run("readonly", (store) =>
          store.get(key)
        )) as StoredRecord | undefined;
        if (record) filesMap.set(key, record);
      } else {
        const dirName = relative.slice(0, firstSlash);
        const dirPath = prefix + dirName;
        if (recursive) {
          // include the direct child directory entry too
          if (directories) dirSet.add(dirPath);
          // and the deeper file (will be picked up below)
          if (files) {
            if (extension && !key.endsWith(extension)) continue;
            const record = (await this.run("readonly", (store) =>
              store.get(key)
            )) as StoredRecord | undefined;
            if (record) filesMap.set(key, record);
          }
        } else {
          if (directories) dirSet.add(dirPath);
        }
      }
    }

    const results: FileMetadata[] = [];
    for (const dirPath of dirSet) {
      const name = dirPath.split("/").pop() ?? dirPath;
      results.push({
        name,
        path: dirPath,
        isDirectory: true,
        size: 0,
        modifiedAt: new Date(0),
        createdAt: new Date(0),
      });
    }
    for (const [key, record] of filesMap) {
      const name = key.split("/").pop() ?? key;
      results.push({
        name,
        path: key,
        isDirectory: false,
        size: record.size,
        modifiedAt: new Date(record.modifiedAt),
        createdAt: new Date(record.createdAt),
      });
    }
    return results;
  }

  async stat(path: string): Promise<FileMetadata | null> {
    const normalized = normalizePath(path);
    const record = (await this.run("readonly", (store) =>
      store.get(normalized)
    )) as StoredRecord | undefined;

    if (record) {
      const name = normalized.split("/").pop() ?? normalized;
      return {
        name,
        path: normalized,
        isDirectory: false,
        size: record.size,
        modifiedAt: new Date(record.modifiedAt),
        createdAt: new Date(record.createdAt),
      };
    }

    const prefix = parentPrefix(normalized);
    const allKeys = await this.getAllKeys();
    const hasChildren = allKeys.some((k) => k.startsWith(prefix));
    if (!hasChildren) return null;

    const name = normalized.split("/").pop() ?? normalized;
    return {
      name,
      path: normalized,
      isDirectory: true,
      size: 0,
      modifiedAt: new Date(0),
      createdAt: new Date(0),
    };
  }

  async exists(path: string): Promise<boolean> {
    return (await this.stat(path)) !== null;
  }
}

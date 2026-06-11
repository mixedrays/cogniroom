/**
 * Storage adapters exports
 *
 * Note: this barrel includes the Node-only FileSystemAdapter. Browser code
 * should deep-import `./indexeddb` or use the module's `client` entry.
 */

export { StorageAdapter } from "./base";
export { FileSystemAdapter } from "./filesystem";
export { IndexedDBAdapter } from "./indexeddb";

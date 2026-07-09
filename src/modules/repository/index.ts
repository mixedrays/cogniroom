/**
 * Isomorphic domain repository: pure course/deck operations parameterized over
 * a `StorageApi`. Server route handlers call these with the filesystem adapter;
 * the browser local repository (`src/lib/localRepo.ts`) calls them with an
 * IndexedDB adapter. One implementation, two storage backends.
 */

export * as courseRepo from "./courses";
export * as deckRepo from "./decks";
export * as sessionRepo from "./sessions";
export * as memoryRepo from "./memory";
export * as sourceRepo from "./sources";
export type { MutationResult } from "./courses";
export type { CreateDeckInput } from "./decks";
export type { Session, SessionMeta, SessionScope } from "./sessions";
export type { StoreSourceInput } from "./sources";

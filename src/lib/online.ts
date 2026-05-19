export const OFFLINE_MESSAGE =
  "You are offline. This action requires a network connection.";

export class OfflineError extends Error {
  constructor(message: string = OFFLINE_MESSAGE) {
    super(message);
    this.name = "OfflineError";
  }
}

export function isOffline(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.onLine === false;
}

export function assertOnline(): void {
  if (isOffline()) {
    throw new OfflineError();
  }
}

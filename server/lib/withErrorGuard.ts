import { HTTPError } from "h3";
import type { H3Event } from "h3";
import { toErrorMessage } from "./errors";

/**
 * Wrap an event handler so domain `HTTPError`s pass through untouched while any
 * other thrown value is logged and rethrown as a 500 with a consistent message.
 * Compose with h3's `defineEventHandler`:
 *
 *   export default defineEventHandler(
 *     withErrorGuard("Failed to generate lesson", async (event) => { ... })
 *   );
 */
export function withErrorGuard<T>(
  failureMessage: string,
  handler: (event: H3Event) => Promise<T> | T
): (event: H3Event) => Promise<T> {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      if (error instanceof HTTPError) throw error;
      console.error(`${failureMessage}:`, error);
      throw new HTTPError({
        status: 500,
        message: `${failureMessage}: ${toErrorMessage(error)}`,
      });
    }
  };
}

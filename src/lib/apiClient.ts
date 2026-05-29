/**
 * Thin JSON fetch helpers shared by the client-side data layer.
 * They centralize the request shape and error handling that every
 * `course`/`deck` operation would otherwise repeat inline.
 */

export interface MutationResult {
  success: boolean;
  error?: string;
}

function extractMessage(parsed: unknown): string | null {
  if (parsed && typeof parsed === "object" && "message" in parsed) {
    return String((parsed as { message?: unknown }).message);
  }
  return null;
}

/**
 * POST a JSON body and return the parsed result. On a failed response the
 * server's `message` is surfaced as `error` (falling back to `failMessage`
 * plus the status code); network failures resolve to a failure result too.
 */
export async function postJson<T = MutationResult>(
  url: string,
  body: unknown,
  failMessage = "Request failed"
): Promise<T> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        extractMessage(parsed) ?? `${failMessage} (${response.status})`;
      return { success: false, error: message } as T;
    }
    return (parsed ?? { success: true }) as T;
  } catch (e) {
    return { success: false, error: String(e) } as T;
  }
}

/**
 * GET and parse JSON, returning null when the resource is missing (404) or any
 * error occurs. Intended for use inside `withReadMirror` fetchers.
 */
export async function getJson<T>(
  url: string,
  errorLabel?: string
): Promise<T | null> {
  try {
    const response = await fetch(url);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(response.statusText);
    return (await response.json()) as T;
  } catch (e) {
    console.error(errorLabel ?? `Error fetching ${url}:`, e);
    return null;
  }
}

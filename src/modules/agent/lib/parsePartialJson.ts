/**
 * Attempts to fix incomplete JSON by closing open structures.
 * Inspired by Vercel AI SDK's partial JSON approach for streaming structured output.
 *
 * Returns the parsed object if the fixed JSON is valid, or `undefined` if it cannot be repaired.
 */
export function parsePartialJson(text: string): unknown | undefined {
  // Try as-is first (fast path for complete JSON)
  try {
    return JSON.parse(text);
  } catch {
    // Continue to repair
  }

  const repaired = repairJson(text);
  if (repaired === undefined) return undefined;

  try {
    return JSON.parse(repaired);
  } catch {
    return undefined;
  }
}

function repairJson(text: string): string | undefined {
  // Remove trailing whitespace
  let json = text.trimEnd();

  if (json.length === 0) return undefined;

  // Track state via a stack of open structures
  const stack: Array<"object" | "array"> = [];
  let inString = false;
  let escape = false;
  let i = 0;

  while (i < json.length) {
    const char = json[i];

    if (escape) {
      escape = false;
      i++;
      continue;
    }

    if (char === "\\") {
      escape = true;
      i++;
      continue;
    }

    if (inString) {
      if (char === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    // Not in a string
    switch (char) {
      case '"':
        inString = true;
        break;
      case "{":
        stack.push("object");
        break;
      case "[":
        stack.push("array");
        break;
      case "}":
        if (stack.length === 0 || stack[stack.length - 1] !== "object")
          return undefined;
        stack.pop();
        break;
      case "]":
        if (stack.length === 0 || stack[stack.length - 1] !== "array")
          return undefined;
        stack.pop();
        break;
    }

    i++;
  }

  // If still inside a string, close it
  if (inString) {
    json += '"';
  }

  // Remove trailing commas, colons, or incomplete key-value separators
  json = json.replace(/[,:\s]+$/, "");

  // Remove a trailing key without value inside an object: e.g. `{"a": 1, "b` → `{"a": 1`
  // Only apply when the current context is an object (not an array)
  if (stack.length > 0 && stack[stack.length - 1] === "object") {
    json = json.replace(/,\s*"[^"]*"$/, "");
  }

  // Close all open structures in reverse order
  for (let j = stack.length - 1; j >= 0; j--) {
    json += stack[j] === "object" ? "}" : "]";
  }

  return json;
}

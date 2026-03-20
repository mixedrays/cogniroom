/**
 * Shared parsing utilities for frontmatter markdown files.
 *
 * File structure: items separated by `---` boundary lines.
 * Each item consists of a frontmatter block (key: value pairs) followed by
 * a content block (markdown prose). Code fences are respected — `---` lines
 * inside backtick fences are NOT treated as boundaries.
 */

/**
 * Split content on `---` boundary lines, respecting fenced code blocks.
 * Returns an array of string segments between boundaries.
 *
 * Example: "---\nfm1\n---\ncontent1\n---"
 * → ['', 'fm1', 'content1', '']
 */
export function splitOnBoundaries(content: string): string[] {
  const lines = content.split("\n");
  const parts: string[] = [];
  let current: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line) || /^~~~/.test(line)) {
      inCodeBlock = !inCodeBlock;
      current.push(line);
    } else if (!inCodeBlock && line === "---") {
      parts.push(current.join("\n"));
      current = [];
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    parts.push(current.join("\n"));
  }

  return parts;
}

/**
 * Parse a frontmatter block (key: value pairs) into a plain object.
 * Splits on the FIRST ": " occurrence so values may contain colons.
 * Supports multiline values (e.g. code blocks embedded in question fields).
 * A new key is detected when a line matches `word-chars: ` at the start.
 * Booleans `true` / `false` are converted to their JS equivalents.
 */
export function parseFrontmatter(
  text: string
): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  const lines = text.trim().split("\n");

  let currentKey: string | null = null;
  let currentValueLines: string[] = [];

  const flush = () => {
    if (currentKey === null) return;
    const value = currentValueLines.join("\n").trim();
    if (value === "true") result[currentKey] = true;
    else if (value === "false") result[currentKey] = false;
    else result[currentKey] = value;
    currentKey = null;
    currentValueLines = [];
  };

  let inCodeBlock = false;

  for (const line of lines) {
    if (/^```/.test(line) || /^~~~/.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (currentKey !== null) currentValueLines.push(line);
      continue;
    }

    if (!inCodeBlock) {
      const colonIdx = line.indexOf(": ");
      if (colonIdx !== -1) {
        const potentialKey = line.slice(0, colonIdx);
        if (/^[\w-]+$/.test(potentialKey)) {
          flush();
          currentKey = potentialKey;
          currentValueLines = [line.slice(colonIdx + 2)];
          continue;
        }
      }
    }

    if (currentKey !== null) {
      currentValueLines.push(line);
    }
  }

  flush();
  return result;
}

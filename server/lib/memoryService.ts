import { promises as fs } from "fs";
import path from "path";
import { MEMORY_DIR } from "@root/server/env";

const VALID_KEY = /^[A-Za-z0-9_-]+$/;

function resolveMemoryPath(key: string): string {
  if (!VALID_KEY.test(key)) {
    throw new Error(`Invalid memory key: ${key}`);
  }
  return path.join(MEMORY_DIR, `${key}.md`);
}

export async function readMemory(key: string): Promise<string | null> {
  try {
    return await fs.readFile(resolveMemoryPath(key), "utf-8");
  } catch {
    return null;
  }
}

export async function writeMemory(key: string, content: string): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  await fs.writeFile(resolveMemoryPath(key), content, "utf-8");
}

export async function deleteMemory(key: string): Promise<boolean> {
  try {
    await fs.unlink(resolveMemoryPath(key));
    return true;
  } catch {
    return false;
  }
}

export async function clearAllMemory(): Promise<number> {
  let files: string[];
  try {
    files = await fs.readdir(MEMORY_DIR);
  } catch {
    return 0;
  }
  const targets = files.filter((f) => f.endsWith(".md"));
  await Promise.all(
    targets.map((f) => fs.unlink(path.join(MEMORY_DIR, f)).catch(() => {}))
  );
  return targets.length;
}

export async function listMemoryEntries(): Promise<
  { key: string; content: string }[]
> {
  let files: string[];
  try {
    files = await fs.readdir(MEMORY_DIR);
  } catch {
    return [];
  }
  const entries = await Promise.all(
    files
      .filter((f) => f.endsWith(".md"))
      .map(async (f) => {
        const key = f.slice(0, -3);
        const content = await fs.readFile(path.join(MEMORY_DIR, f), "utf-8");
        return { key, content: content.trim() };
      })
  );
  return entries.filter((e) => e.content.length > 0).sort((a, b) =>
    a.key.localeCompare(b.key)
  );
}

export async function getMemoryContext(): Promise<string> {
  const entries = await listMemoryEntries();
  if (entries.length === 0) return "";
  const body = entries
    .map((e) => `### ${e.key}\n${e.content}`)
    .join("\n\n");
  return [
    "USER MEMORY (persisted notes about the user — consider these when responding):",
    body,
  ].join("\n");
}

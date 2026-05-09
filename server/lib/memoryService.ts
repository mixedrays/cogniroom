import { promises as fs } from "fs";
import path from "path";
import { MEMORY_DIR } from "@root/server/env";

export async function readMemory(key: string): Promise<string | null> {
  const filePath = path.join(MEMORY_DIR, `${key}.md`);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function writeMemory(key: string, content: string): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true });
  const filePath = path.join(MEMORY_DIR, `${key}.md`);
  await fs.writeFile(filePath, content, "utf-8");
}

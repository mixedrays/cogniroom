import { promises as fs } from "fs";
import path from "path";
import os from "os";

function getMemoryDir(): string {
  const projectRoot = process.cwd();
  const projectHash = projectRoot.replace(/\//g, "-");
  return path.join(os.homedir(), ".claude", "projects", projectHash, "memory");
}

export async function readMemory(key: string): Promise<string | null> {
  const filePath = path.join(getMemoryDir(), `${key}.md`);
  try {
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return null;
  }
}

export async function writeMemory(key: string, content: string): Promise<void> {
  const dir = getMemoryDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `${key}.md`);
  await fs.writeFile(filePath, content, "utf-8");
}

import { promises as fs } from "fs";
import path from "path";
import type { AgentMessageState } from "@/modules/agent/types";

function getHistoryDir(): string {
  return path.resolve(process.env.HISTORY_DIR ?? ".history", "wizard-agent");
}

function getHistoryPath(contextId: string): string {
  const safe = contextId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return path.join(getHistoryDir(), `${safe}.json`);
}

export async function readHistory(contextId: string): Promise<AgentMessageState[]> {
  try {
    const text = await fs.readFile(getHistoryPath(contextId), "utf-8");
    return JSON.parse(text);
  } catch {
    return [];
  }
}

export async function writeHistory(
  contextId: string,
  messages: AgentMessageState[]
): Promise<void> {
  const dir = getHistoryDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(getHistoryPath(contextId), JSON.stringify(messages), "utf-8");
}

export async function clearHistory(contextId: string): Promise<void> {
  try {
    await fs.unlink(getHistoryPath(contextId));
  } catch {
    // already gone
  }
}

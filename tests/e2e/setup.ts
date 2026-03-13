import { spawn, type ChildProcess } from "child_process";

let devServer: ChildProcess | null = null;

async function waitForServer(url: string, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function isServerRunning(url: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

export async function setup() {
  if (await isServerRunning("http://localhost:3000")) {
    return;
  }

  devServer = spawn("npm", ["run", "dev"], {
    stdio: "pipe",
    shell: true,
    env: { ...process.env, NODE_ENV: "development" },
  });

  await waitForServer("http://localhost:3000");
}

export async function teardown() {
  if (devServer) {
    devServer.kill("SIGTERM");
    devServer = null;
  }
}

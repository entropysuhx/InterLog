import { spawn, spawnSync } from "node:child_process";

const host = "127.0.0.1";
const port = "3000";
const baseUrl = `http://${host}:${port}`;
const isWindows = process.platform === "win32";

function startNext() {
  return spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "--hostname", host, "--port", port],
    {
      cwd: process.cwd(),
      detached: !isWindows,
      env: process.env,
      stdio: process.env.E2E_DEBUG_SERVER === "1" ? "inherit" : "ignore",
      windowsHide: true,
    },
  );
}

async function waitForServer() {
  const startedAt = Date.now();
  const timeoutMs = 120_000;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/dashboard`, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("Next.js server did not become ready for Playwright.");
}

function killTree(child) {
  if (!child.pid) return;
  if (isWindows) {
    spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    return;
  }
}

function runPlaywright(args) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["node_modules/@playwright/test/cli.js", "test", ...args],
      {
        cwd: process.cwd(),
        env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: "1" },
        stdio: "inherit",
        windowsHide: true,
      },
    );
    child.on("exit", (code, signal) => {
      resolve(signal ? 1 : code ?? 1);
    });
  });
}

const next = startNext();

const stopAndExit = (code) => {
  killTree(next);
  process.exit(code);
};

process.on("SIGINT", () => stopAndExit(130));
process.on("SIGTERM", () => stopAndExit(143));

try {
  await waitForServer();
  const exitCode = await runPlaywright(process.argv.slice(2));
  stopAndExit(exitCode);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  stopAndExit(1);
}

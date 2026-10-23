import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const root = process.cwd();
const outDir = path.join(root, "out");
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const profileDir = path.join(root, "node_modules", ".cache", `measurement-browser-${process.pid}`);
const host = "www.peptidesnearby.com";
const expectedFreshProfile = Number(process.env.PN_EXPECT_FRESH_PROFILE ?? "1");

const contentTypes: Record<string, string> = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "application/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".txt": "text/x-component",
  ".woff2": "font/woff2",
};

function safeStaticPath(urlPath: string): string {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "");
  const requested = path.resolve(outDir, relative);
  if (!requested.startsWith(`${path.resolve(outDir)}${path.sep}`) && requested !== path.resolve(outDir)) {
    throw new Error("Unsafe static path");
  }
  return requested;
}

async function startStaticServer(): Promise<{ server: Server; port: number }> {
  const server = createServer(async (request, response) => {
    try {
      let filePath = safeStaticPath(request.url || "/");
      const extension = path.extname(filePath);
      if (!extension) filePath = filePath.endsWith(path.sep) ? `${filePath.slice(0, -1)}.html` : `${filePath}.html`;
      const body = await fs.readFile(filePath);
      response.writeHead(200, { "content-type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Static server did not bind a TCP port");
  return { server, port: address.port };
}

async function availablePort(): Promise<number> {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, "127.0.0.1", resolve));
  const address = probe.address();
  if (!address || typeof address === "string") throw new Error("Could not reserve a debug port");
  const port = address.port;
  await new Promise<void>((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  return port;
}

class CdpClient {
  private id = 0;
  private pending = new Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private listeners = new Map<string, Array<(params: Record<string, unknown>) => void>>();

  constructor(private socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const waiter = this.pending.get(message.id);
        if (!waiter) return;
        this.pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message));
        else waiter.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    });
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }

  on(method: string, listener: (params: Record<string, unknown>) => void) {
    this.listeners.set(method, [...(this.listeners.get(method) || []), listener]);
  }

  close() { this.socket.close(); }
}

async function connectCdp(debugPort: number): Promise<CdpClient> {
  let targets: Array<{ type: string; webSocketDebuggerUrl: string }> = [];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response) => response.json());
      if (targets.some((target) => target.type === "page")) break;
    } catch {}
    await delay(100);
  }
  const page = targets.find((target) => target.type === "page");
  if (!page) throw new Error("Edge did not expose a page target");
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener("error", () => reject(new Error("CDP socket failed")), { once: true });
  });
  return new CdpClient(socket);
}

async function evaluate<T>(cdp: CdpClient, expression: string): Promise<T> {
  const result = await cdp.send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }) as {
    result: { value: T };
    exceptionDetails?: unknown;
  };
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
  return result.result.value;
}

async function waitFor(cdp: CdpClient, expression: string, label: string) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate<boolean>(cdp, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function eventCountScript(eventName: string): string {
  return `(window.dataLayer||[]).filter((entry)=>entry&&entry[0]==='event'&&entry[1]===${JSON.stringify(eventName)}).length`;
}

async function main() {
  let server: Server | undefined;
  let edge: ChildProcess | undefined;
  let cdp: CdpClient | undefined;

  try {
  await fs.access(path.join(outDir, "providers", "re-wellness-scottsdale-az.html"));
  await fs.access(edgePath);
  await fs.mkdir(profileDir, { recursive: true });

  const staticServer = await startStaticServer();
  server = staticServer.server;
  const debugPort = await availablePort();
  edge = spawn(edgePath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${debugPort}`,
    `--host-resolver-rules=MAP ${host} 127.0.0.1`,
    "--disable-features=HttpsUpgrades,HttpsFirstModeV2",
    "about:blank",
  ], { stdio: "ignore", windowsHide: true });

  cdp = await connectCdp(debugPort);
  const intercepted: string[] = [];
  cdp.on("Fetch.requestPaused", (params) => {
    const request = params.request as { url: string };
    intercepted.push(request.url);
    void cdp!.send("Fetch.failRequest", { requestId: params.requestId, errorReason: "BlockedByClient" });
  });
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Fetch.enable", {
    patterns: [
      { urlPattern: "*googletagmanager.com*", requestStage: "Request" },
      { urlPattern: "*google-analytics.com*", requestStage: "Request" },
      { urlPattern: "*analytics.google.com*", requestStage: "Request" },
    ],
  });

  const origin = `http://${host}:${staticServer.port}`;
  await cdp.send("Page.navigate", { url: `${origin}/providers/re-wellness-scottsdale-az/` });
  await waitFor(cdp, "document.readyState==='complete' && !!window.next", "Next hydration");
  await delay(300);

  const freshProfile = await evaluate<number>(cdp, eventCountScript("eligible_provider_profile_impression"));
  assert.equal(freshProfile, expectedFreshProfile, "fresh profile hydration emitted an unexpected impression count");
  assert.equal(await evaluate<number>(cdp, eventCountScript("eligible_local_page_impression")), 0);

  await waitFor(
    cdp,
    `(()=>{const link=document.querySelector('a[href="/arizona/scottsdale"]');return !!link&&Object.keys(link).some((key)=>key.startsWith('__reactProps$'))})()`,
    "hydrated city breadcrumb link"
  );
  await evaluate(cdp, `window.__pnHydrationMarker='kept'; document.querySelector('a[href="/arizona/scottsdale"]')?.click()`);
  await waitFor(cdp, "location.pathname.replace(/\\/$/,'')==='/arizona/scottsdale'", "client navigation to local page");
  await delay(300);
  assert.equal(await evaluate<string>(cdp, "window.__pnHydrationMarker"), "kept", "navigation must stay inside the hydrated React app");
  assert.equal(await evaluate<number>(cdp, eventCountScript("eligible_local_page_impression")), 1, "client navigation must emit one local-page impression");

  await evaluate(cdp, `document.querySelector('a[href="/providers/re-wellness-scottsdale-az"]')?.click()`);
  await waitFor(cdp, "location.pathname.replace(/\\/$/,'')==='/providers/re-wellness-scottsdale-az'", "client navigation back to profile");
  await delay(300);
  const finalProfile = await evaluate<number>(cdp, eventCountScript("eligible_provider_profile_impression"));
  assert.equal(finalProfile, Math.max(1, expectedFreshProfile), "profile impression must be present and session-deduplicated after client navigation");
  assert.ok(intercepted.some((url) => url.includes("googletagmanager.com/gtag/js")), "the GA loader request must be intercepted");
  assert.ok(intercepted.every((url) => /google(tagmanager|-analytics)|analytics\.google/.test(url)), "only analytics requests may enter the interception list");

  console.log(`Browser measurement checks passed. fresh_profile=${freshProfile}; client_local=1; final_profile=${finalProfile}; analytics_requests_intercepted=${intercepted.length}.`);
  } finally {
    cdp?.close();
    if (edge && !edge.killed) {
      edge.kill();
      await Promise.race([
        new Promise<void>((resolve) => edge!.once("exit", () => resolve())),
        delay(2_000).then(() => undefined),
      ]);
    }
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await fs.rm(profileDir, { recursive: true, force: true });
        break;
      } catch (error) {
        if (attempt === 19) console.warn(`Browser profile cleanup deferred: ${(error as Error).message}`);
        await delay(100);
      }
    }
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  }
);

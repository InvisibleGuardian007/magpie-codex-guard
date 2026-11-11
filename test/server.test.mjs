import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { startServer } from "../lib/server.mjs";

function home() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "codex-guard-srv-"));
}

function writeState(dir, json) {
  fs.writeFileSync(path.join(dir, ".codex-global-state.json"), JSON.stringify(json, null, 2));
}

function healthy() {
  const json = {};
  for (let i = 0; i < 35; i += 1) json["key" + i] = i;
  json["local-projects"] = { a: { name: "Monster-Girl" } };
  json["thread-project-assignments"] = { t1: "a" };
  const atoms = {};
  for (let i = 0; i < 120; i += 1) atoms["sidebar-project-expanded-v1-codex:" + i] = true;
  json["electron-persisted-atom-state"] = atoms;
  return json;
}

async function withServer(fn) {
  const dir = home();
  const server = await startServer({ port: 0, options: { codexHome: dir, gateway: "http://127.0.0.1:1", configDir: dir } });
  try {
    await fn(server, dir);
  } finally {
    server.close();
  }
}

function post(server, route, input) {
  return fetch("http://127.0.0.1:" + server.port + route, {
    method: "POST",
    headers: { "content-type": "application/json", "x-codex-guard-token": server.token },
    body: JSON.stringify(input || {})
  }).then((res) => res.json());
}

test("the health route answers without a token", async () => {
  await withServer(async (server) => {
    const res = await fetch("http://127.0.0.1:" + server.port + "/_codexguard/health");
    assert.equal(res.status, 200);
    const said = await res.json();
    assert.equal(said.app, "codex-guard");
  });
});

test("an api route without the token is refused", async () => {
  await withServer(async (server) => {
    const res = await fetch("http://127.0.0.1:" + server.port + "/api/state");
    assert.equal(res.status, 401);
  });
});

test("a foreign Host header is refused", async () => {
  const http = await import("node:http");
  await withServer(async (server) => {
    const status = await new Promise((done, fail) => {
      const req = http.request(
        { host: "127.0.0.1", port: server.port, path: "/_codexguard/health", headers: { host: "example.com" } },
        (res) => {
          res.resume();
          done(res.statusCode);
        }
      );
      req.on("error", fail);
      req.end();
    });
    assert.equal(status, 403);
  });
});

test("state, snapshot, plan, merge and full restore through the api", async () => {
  await withServer(async (server, dir) => {
    writeState(dir, healthy());
    const headers = { "x-codex-guard-token": server.token };
    const state = await (await fetch("http://127.0.0.1:" + server.port + "/api/state", { headers })).json();
    assert.equal(state.codex.mode, "healthy");
    assert.equal(state.quota.ok, false, "a dead gateway is reported, not thrown");

    const made = await post(server, "/api/snapshot", { name: "good" });
    assert.equal(made.ok, true);

    writeState(dir, { a: 1, b: 2 });
    const plan = await post(server, "/api/plan", { name: "good" });
    assert.equal(plan.ok, true);
    assert.ok(plan.plan.adds.includes("local-projects"));
    assert.equal(plan.plan.kept, 2, "the plan counts the settings a merge leaves alone");

    const merged = await post(server, "/api/restore", { name: "good", mode: "merge" });
    assert.equal(merged.ok, true);
    assert.equal(merged.restored.mode, "merge");
    assert.equal(merged.state.codex.projectCount, 1);
    const after = JSON.parse(fs.readFileSync(path.join(dir, ".codex-global-state.json"), "utf8"));
    assert.equal(after.a, 1, "a merge keeps the settings it does not own");
    assert.equal(after.b, 2);

    writeState(dir, { a: 1, b: 2 });
    const restored = await post(server, "/api/restore", { name: "good", mode: "full" });
    assert.equal(restored.ok, true);
    assert.equal(restored.state.codex.mode, "healthy");
    const replaced = JSON.parse(fs.readFileSync(path.join(dir, ".codex-global-state.json"), "utf8"));
    assert.equal(replaced.a, undefined, "a full restore replaces the file");
  });
});

test("the page html carries the token and a strict policy", async () => {
  await withServer(async (server) => {
    const res = await fetch("http://127.0.0.1:" + server.port + "/");
    const html = await res.text();
    assert.ok(html.includes(server.token));
    assert.match(res.headers.get("content-security-policy") || "", /default-src 'none'/);
    assert.match(res.headers.get("content-security-policy") || "", /connect-src 'self' http:\/\/127\.0\.0\.1:/);
  });
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspect, makeSnapshot, restoreSnapshot, mergeSnapshot, mergePlan, listSnapshots, checkName } from "../lib/codex.mjs";

function home() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "codex-guard-"));
  return dir;
}

function writeState(dir, json) {
  fs.writeFileSync(path.join(dir, ".codex-global-state.json"), JSON.stringify(json, null, 2));
}

function atoms(n) {
  const json = {};
  for (let i = 0; i < n; i += 1) json["sidebar-project-expanded-v1-codex:" + i] = i % 2 === 0;
  return json;
}

function healthy() {
  const json = {};
  for (let i = 0; i < 35; i += 1) json["key" + i] = i;
  json["local-projects"] = { a: { name: "Monster-Girl" }, b: { name: "Giantess" } };
  json["thread-project-assignments"] = { t1: "a", t2: "b", t3: "a" };
  json["electron-saved-workspace-roots"] = ["D:/x"];
  json["selected-project"] = "a";
  json["electron-persisted-atom-state"] = atoms(120);
  return json;
}

// What magpie leaves behind: the project keys survive but the sidebar atom state
// is cut down to a couple of entries, so the UI renders no projects.
function atomWiped() {
  const json = healthy();
  json["electron-persisted-atom-state"] = { "electron:onboarding-projectless-completed": true };
  return json;
}

function anonymous() {
  const json = {};
  for (let i = 0; i < 25; i += 1) json["key" + i] = i;
  return json;
}

test("a signed-in state file is healthy", () => {
  const dir = home();
  writeState(dir, healthy());
  const said = inspect(dir);
  assert.equal(said.mode, "healthy");
  assert.equal(said.projectCount, 2);
  assert.equal(said.assignmentCount, 3);
  assert.ok(said.topKeys >= 35);
});

test("a signed-out state file is anonymous", () => {
  const dir = home();
  writeState(dir, anonymous());
  const said = inspect(dir);
  assert.equal(said.mode, "anonymous");
  assert.equal(said.projectCount, 0);
});

test("a missing state file is reported, not thrown", () => {
  const said = inspect(home());
  assert.equal(said.mode, "missing");
  assert.equal(said.exists, false);
});

test("snapshot then restore puts the projects back", () => {
  const dir = home();
  writeState(dir, healthy());
  makeSnapshot(dir, "good", "while signed in");
  writeState(dir, anonymous());
  assert.equal(inspect(dir).mode, "anonymous");

  const done = restoreSnapshot(dir, "good");
  assert.equal(done.topKeys >= 35, true);
  assert.equal(inspect(dir).mode, "healthy");

  const rows = listSnapshots(dir);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "good");
  assert.equal(rows[0].usable, true);
  assert.ok(fs.existsSync(done.preRestore), "the replaced file is kept");
  assert.equal(inspect(done.preRestore.replace(/\\/g, "/")).mode, "anonymous");
});

test("a merge brings the projects back and leaves other settings alone", () => {
  const dir = home();
  writeState(dir, healthy());
  makeSnapshot(dir, "good");

  const current = anonymous();
  current["electron-main-window-bounds"] = { width: 1200 };
  current["electron-thread-read-state-v1"] = { t9: 5 };
  writeState(dir, current);

  const plan = mergePlan(dir, "good");
  assert.ok(plan.adds.includes("local-projects"));
  assert.equal(plan.kept, 27, "the 27 keys a merge does not own are counted as kept");

  const done = mergeSnapshot(dir, "good");
  assert.equal(done.mode, "merge");
  assert.equal(done.projectCount, 2);
  assert.equal(done.assignmentCount, 3);

  const after = JSON.parse(fs.readFileSync(path.join(dir, ".codex-global-state.json"), "utf8"));
  assert.ok(after["local-projects"], "projects are back");
  assert.deepEqual(after["electron-main-window-bounds"], { width: 1200 }, "window bounds untouched");
  assert.deepEqual(after["electron-thread-read-state-v1"], { t9: 5 }, "read state untouched");
  assert.equal(after["key3"], 3, "the anonymous file's own keys stay");
  assert.ok(fs.existsSync(done.preRestore), "the anonymous file is kept before the merge");
});

test("merging twice is harmless and a signed-out snapshot is refused", () => {
  const dir = home();
  writeState(dir, healthy());
  makeSnapshot(dir, "good");
  writeState(dir, anonymous());
  mergeSnapshot(dir, "good");
  const again = mergeSnapshot(dir, "good");
  assert.ok(again.replaces.length > 0, "the second merge reports what it overwrote");

  writeState(dir, anonymous());
  makeSnapshot(dir, "bad");
  assert.throws(() => mergeSnapshot(dir, "bad"), /signed-out/);
});

test("an anonymous snapshot is refused", () => {
  const dir = home();
  writeState(dir, anonymous());
  makeSnapshot(dir, "bad");
  writeState(dir, healthy());
  assert.throws(() => restoreSnapshot(dir, "bad"), /signed-out/);
  assert.equal(inspect(dir).mode, "healthy");
});

test("a file whose sidebar atom state was wiped is not healthy", () => {
  const dir = home();
  writeState(dir, atomWiped());
  const said = inspect(dir);
  assert.equal(said.mode, "atom-wiped");
  assert.equal(said.projectCount, 2);
  assert.ok(said.atomKeys < 50);
});

test("a snapshot with a wiped atom state is never used to restore", () => {
  const dir = home();
  writeState(dir, atomWiped());
  makeSnapshot(dir, "bad");
  writeState(dir, atomWiped());
  const rows = listSnapshots(dir);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].usable, false);
  assert.throws(() => mergeSnapshot(dir, "bad"), /sidebar state wiped/);
  assert.throws(() => restoreSnapshot(dir, "bad"), /sidebar state wiped/);
});

test("merging a healthy snapshot brings the sidebar atom state back", () => {
  const dir = home();
  writeState(dir, healthy());
  makeSnapshot(dir, "good");
  const wiped = atomWiped();
  wiped["mine"] = "keep me";
  writeState(dir, wiped);
  const done = mergeSnapshot(dir, "good");
  assert.ok(done.atomRestored >= 120);
  const after = JSON.parse(fs.readFileSync(path.join(dir, ".codex-global-state.json"), "utf8"));
  assert.equal(after["mine"], "keep me");
  assert.ok(Object.keys(after["electron-persisted-atom-state"]).length >= 120);
  assert.equal(inspect(dir).mode, "healthy");
});

test("snapshot names cannot leave the backup folder", () => {
  assert.throws(() => checkName("../evil"), /snapshot name/);
  assert.throws(() => checkName(""), /snapshot name/);
  const dir = home();
  writeState(dir, healthy());
  assert.throws(() => makeSnapshot(dir, "../evil"), /snapshot name/);
});

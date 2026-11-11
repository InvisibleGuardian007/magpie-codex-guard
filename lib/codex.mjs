import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export const STATE_NAME = ".codex-global-state.json";
export const DB_NAME = "state_5.sqlite";

export function codexHome(options) {
  const given = String((options && options.codexHome) || process.env.CODEX_HOME || "").trim();
  return given || path.join(os.homedir(), ".codex");
}

export function statePath(home) {
  return path.join(home, STATE_NAME);
}

export function backupRoot(home) {
  return path.join(home, "state-backups");
}

function count(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

// Codex keeps the sidebar's projects and each session's project in this one
// file, and writes a different shape for each sign-in state: about 43 top-level
// keys with local-projects and thread-project-assignments while signed in, and
// about 25 with neither once signed out. That difference is the whole story of
// "all my projects are gone", so the classification below is the plugin's core.
export function inspect(home) {
  const file = statePath(home);
  const said = {
    home,
    file,
    exists: false,
    readable: false,
    bytes: 0,
    mtime: null,
    topKeys: 0,
    projectCount: 0,
    assignmentCount: 0,
    workspaceRoots: 0,
    selectedProject: null,
    mode: "missing",
    error: null
  };
  let raw;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch (error) {
    said.exists = fs.existsSync(file);
    said.error = String((error && error.message) || error);
    said.mode = said.exists ? "unreadable" : "missing";
    return said;
  }
  said.exists = true;
  said.readable = true;
  said.bytes = Buffer.byteLength(raw, "utf8");
  try {
    said.mtime = fs.statSync(file).mtime.toISOString();
  } catch {
    // mtime is informative only.
  }
  let json;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    said.mode = "unreadable";
    said.error = "invalid json: " + String((error && error.message) || error);
    return said;
  }
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    said.mode = "unreadable";
    said.error = "not a json object";
    return said;
  }
  said.topKeys = Object.keys(json).length;
  said.projectCount = count(json["local-projects"]);
  said.assignmentCount = count(json["thread-project-assignments"]);
  said.workspaceRoots = count(json["electron-saved-workspace-roots"]);
  said.selectedProject = typeof json["selected-project"] === "string" ? json["selected-project"] : null;
  said.atomKeys = count(json["electron-persisted-atom-state"]);
  // The sidebar renders its project panel from the atom state (expanded sections,
  // order, flat-project preferences). A file that still lists 14 projects but has
  // that state wiped renders as "no projects", so it is unhealthy even though the
  // project keys are intact.
  if (said.projectCount === 0 && said.topKeys <= 32) said.mode = "anonymous";
  else if (said.projectCount > 0 && said.atomKeys < MIN_ATOM_KEYS) said.mode = "atom-wiped";
  else if (said.topKeys >= 35 && said.projectCount > 0) said.mode = "healthy";
  else said.mode = "partial";
  return said;
}

// Healthy files carry ~1200 atom entries; anything under this is a file some
// other tool rewrote while dropping the state the sidebar needs.
export const MIN_ATOM_KEYS = 50;

const NAME = /^[A-Za-z0-9._-]{1,64}$/;

export function checkName(name) {
  const value = String(name || "").trim();
  if (!NAME.test(value) || value === "." || value === "..") {
    throw new Error("snapshot name must be 1-64 of A-Z a-z 0-9 . _ -");
  }
  return value;
}

function dirOf(root, name) {
  const base = path.resolve(root);
  const target = path.resolve(base, checkName(name));
  if (target !== path.join(base, path.basename(target)) || !target.startsWith(base + path.sep)) {
    throw new Error("snapshot name leaves the backup folder");
  }
  return target;
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function listSnapshots(home, limit) {
  const root = backupRoot(home);
  let names = [];
  try {
    names = fs.readdirSync(root, { withFileTypes: true }).filter((it) => it.isDirectory() && !it.name.startsWith("pre-restore-")).map((it) => it.name);
  } catch {
    return [];
  }
  const rows = names.map((name) => {
    const dir = path.join(root, name);
    const state = path.join(dir, STATE_NAME);
    const json = readJson(state);
    let bytes = 0;
    let mtime = null;
    try {
      bytes = fs.statSync(state).size;
      mtime = fs.statSync(state).mtime.toISOString();
    } catch {
      // A snapshot without a readable state file is listed but unusable.
    }
    const topKeys = json && typeof json === "object" && !Array.isArray(json) ? Object.keys(json).length : 0;
    const atomKeys = count(json && json["electron-persisted-atom-state"]);
    const meta = readJson(path.join(dir, "meta.json")) || {};
    return {
      name,
      bytes,
      mtime,
      topKeys,
      atomKeys,
      projectCount: count(json && json["local-projects"]),
      assignmentCount: count(json && json["thread-project-assignments"]),
      label: String(meta.label || ""),
      hasDb: fs.existsSync(path.join(dir, DB_NAME)),
      usable: topKeys >= 20 && atomKeys >= MIN_ATOM_KEYS
    };
  });
  rows.sort((a, b) => String(b.mtime || "").localeCompare(String(a.mtime || "")));
  return typeof limit === "number" ? rows.slice(0, limit) : rows;
}

export function makeSnapshot(home, name, label) {
  const dir = dirOf(backupRoot(home), name);
  const state = statePath(home);
  if (!fs.existsSync(state)) throw new Error("no " + STATE_NAME + " to snapshot");
  const json = readJson(state);
  if (!json || typeof json !== "object") throw new Error(STATE_NAME + " is not readable json");
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(state, path.join(dir, STATE_NAME));
  const bak = state + ".bak";
  if (fs.existsSync(bak)) fs.copyFileSync(bak, path.join(dir, STATE_NAME + ".bak"));
  const db = path.join(home, DB_NAME);
  const hasDb = fs.existsSync(db);
  if (hasDb) fs.copyFileSync(db, path.join(dir, DB_NAME));
  const meta = {
    label: String(label || "").slice(0, 120),
    createdAt: new Date().toISOString(),
    topKeys: Object.keys(json).length,
    projectCount: count(json["local-projects"]),
    assignmentCount: count(json["thread-project-assignments"]),
    hasDb
  };
  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  return Object.assign({ name }, meta);
}

export function prunePreRestore(home, keep) {
  const root = backupRoot(home);
  let names = [];
  try {
    names = fs.readdirSync(root, { withFileTypes: true }).filter((it) => it.isDirectory() && it.name.startsWith("pre-restore-")).map((it) => it.name).sort();
  } catch {
    return 0;
  }
  const drop = names.slice(0, Math.max(0, names.length - (keep || 10)));
  for (const name of drop) {
    try {
      fs.rmSync(path.join(root, name), { recursive: true, force: true });
    } catch {
      // Keeping an old copy is harmless.
    }
  }
  return drop.length;
}

export function restoreSnapshot(home, name) {
  const dir = dirOf(backupRoot(home), name);
  const snapState = path.join(dir, STATE_NAME);
  const json = readJson(snapState);
  if (!json || typeof json !== "object" || Array.isArray(json)) throw new Error("snapshot " + name + " has no readable " + STATE_NAME);
  // A snapshot taken while signed out is exactly what the user is trying to
  // escape, so refuse to write one back.
  const { topKeys, projects } = refuseSignedOut(json, name);
  const root = backupRoot(home);
  const state = statePath(home);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pre = path.join(root, "pre-restore-" + stamp);
  fs.mkdirSync(pre, { recursive: true });
  for (const file of [state, state + ".bak", path.join(home, DB_NAME)]) {
    if (fs.existsSync(file)) {
      try {
        fs.copyFileSync(file, path.join(pre, path.basename(file)));
      } catch {
        // A file held open by Codex must not stop the restore.
      }
    }
  }
  fs.copyFileSync(snapState, state);
  fs.copyFileSync(snapState, state + ".bak");
  prunePreRestore(home, 10);
  return { name, topKeys, replacedAt: new Date().toISOString(), preRestore: pre };
}

// The bookkeeping Codex only writes while signed in: the project list, which
// session belongs to which project, the sidebar order, the pins. Restoring just
// these keys puts the projects back without touching anything else in the file
// (window bounds, chat read state, model picks), which is why it is the default.
export const PROJECT_KEYS = [
  "local-projects",
  "project-order",
  "thread-project-assignments",
  "thread-project-membership-host-ids",
  "app-server-project-id-by-legacy-project-id-by-host",
  "project-appearances",
  "pinned-project-ids",
  "pinned-thread-ids",
  "app-server-migrated-pinned-thread-ids-by-host",
  "sidebar-project-thread-orders",
  "thread-workspace-root-hints",
  "thread-writable-roots",
  "thread-projectless-output-directories",
  "projectless-thread-ids",
  "electron-saved-workspace-roots",
  "selected-project"
];

function snapshotJson(home, name) {
  const dir = dirOf(backupRoot(home), name);
  const json = readJson(path.join(dir, STATE_NAME));
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("snapshot " + name + " has no readable " + STATE_NAME);
  }
  return json;
}

function refuseSignedOut(json, name) {
  const topKeys = Object.keys(json).length;
  const projects = count(json["local-projects"]);
  const atomKeys = count(json["electron-persisted-atom-state"]);
  if (topKeys < 20 || (projects === 0 && topKeys < 35)) {
    throw new Error("snapshot " + name + " looks signed-out (" + topKeys + " top-level keys, " + projects + " projects); refusing to restore it");
  }
  if (atomKeys < MIN_ATOM_KEYS) {
    throw new Error("snapshot " + name + " has its sidebar state wiped (" + atomKeys + " UI keys, needs " + MIN_ATOM_KEYS + "); refusing to restore it");
  }
  return { topKeys, projects, atomKeys };
}

// What a merge would change, without writing anything.
export function mergePlan(home, name) {
  const snap = snapshotJson(home, name);
  const { topKeys, projects } = refuseSignedOut(snap, name);
  const current = readJson(statePath(home)) || {};
  const adds = [];
  const replaces = [];
  for (const key of PROJECT_KEYS) {
    if (!(key in snap)) continue;
    if (key in current) replaces.push(key);
    else adds.push(key);
  }
  return {
    name,
    snapshotTopKeys: topKeys,
    snapshotProjects: projects,
    snapshotAssignments: count(snap["thread-project-assignments"]),
    snapshotAtomKeys: count(snap["electron-persisted-atom-state"]),
    currentAtomKeys: count(current["electron-persisted-atom-state"]),
    currentTopKeys: Object.keys(current).length,
    currentMode: inspect(home).mode,
    adds,
    replaces,
    kept: Object.keys(current).filter((key) => !PROJECT_KEYS.includes(key)).length
  };
}

export function mergeSnapshot(home, name) {
  const snap = snapshotJson(home, name);
  refuseSignedOut(snap, name);
  const state = statePath(home);
  const current = readJson(state) || {};
  const merged = Object.assign({}, current);
  const adds = [];
  const replaces = [];
  for (const key of PROJECT_KEYS) {
    if (!(key in snap)) continue;
    if (key in merged) replaces.push(key);
    else adds.push(key);
    merged[key] = snap[key];
  }
  // The sidebar project panel is rendered from the atom state; a snapshot whose
  // atom state is still whole can put it back. Snapshot keys win, whatever the
  // current file has on top stays.
  const snapAtom = snap["electron-persisted-atom-state"];
  const curAtom = merged["electron-persisted-atom-state"];
  const snapAtomKeys = count(snapAtom);
  let atomRestored = 0;
  if (snapAtomKeys >= MIN_ATOM_KEYS && snapAtomKeys > count(curAtom)) {
    merged["electron-persisted-atom-state"] = Object.assign({}, snapAtom, curAtom && typeof curAtom === "object" && !Array.isArray(curAtom) ? curAtom : {});
    atomRestored = count(merged["electron-persisted-atom-state"]);
  }
  if (adds.length === 0 && replaces.length === 0 && atomRestored === 0) throw new Error("nothing to merge from " + name);
  const root = backupRoot(home);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pre = path.join(root, "pre-restore-" + stamp);
  fs.mkdirSync(pre, { recursive: true });
  for (const file of [state, state + ".bak", path.join(home, DB_NAME)]) {
    if (fs.existsSync(file)) {
      try {
        fs.copyFileSync(file, path.join(pre, path.basename(file)));
      } catch {
        // A file held open by Codex must not stop the merge.
      }
    }
  }
  const text = JSON.stringify(merged, null, 2);
  fs.writeFileSync(state, text);
  fs.writeFileSync(state + ".bak", text);
  prunePreRestore(home, 10);
  return {
    name,
    mode: "merge",
    adds,
    replaces,
    topKeys: Object.keys(merged).length,
    projectCount: count(merged["local-projects"]),
    assignmentCount: count(merged["thread-project-assignments"]),
    atomKeys: count(merged["electron-persisted-atom-state"]),
    atomRestored,
    mergedAt: new Date().toISOString(),
    preRestore: pre
  };
}

export function newestHealthy(home) {
  return listSnapshots(home).find((row) => row.usable && row.topKeys >= 35 && row.projectCount > 0 && row.atomKeys >= MIN_ATOM_KEYS) || null;
}

export function snapshotName(prefix) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  return String(prefix || "snap") + "-" + stamp;
}

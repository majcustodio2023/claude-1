#!/usr/bin/env node
/**
 * Pull the deployed source of every Vercel project in the Aacio team into ./projects/<name>/.
 *
 * Usage:
 *   VERCEL_TOKEN=xxxx node tools/pull-vercel-sources.mjs            # all projects
 *   VERCEL_TOKEN=xxxx node tools/pull-vercel-sources.mjs jaytees    # one or more project names
 *   node tools/pull-vercel-sources.mjs --verify                     # only check existing files against the manifest
 *
 * Get a token at https://vercel.com/account/tokens (scope: the "Aacio" team).
 * Files are verified against their SHA-1 (Vercel's file id IS the SHA-1 of the content),
 * so re-running is safe and only downloads what is missing or changed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECTS_DIR = path.join(ROOT, 'projects');
const INVENTORY = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, 'inventory.json'), 'utf8'));
const TEAM_ID = INVENTORY.teamId;
const TOKEN = process.env.VERCEL_TOKEN;
const args = process.argv.slice(2);
const verifyOnly = args.includes('--verify');
const only = new Set(args.filter((a) => !a.startsWith('--')));
const SKIP_TOP = new Set(['dist', 'node_modules', '.next', 'out']);
const SKIP_FILES = new Set(['tsconfig.tsbuildinfo']);

const sha1 = (buf) => crypto.createHash('sha1').update(buf).digest('hex');
const api = async (p) => {
  const url = new URL(`https://api.vercel.com${p}`);
  url.searchParams.set('teamId', TEAM_ID);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${p}: ${await r.text()}`);
  return r;
};

function* walk(nodes, prefix = '') {
  for (const n of nodes) {
    const p = prefix + n.name;
    if (n.type === 'directory') {
      if (SKIP_TOP.has(n.name) && (prefix.match(/\//g) || []).length <= 1) continue;
      yield* walk(n.children || [], p + '/');
    } else if (n.type === 'file' && !SKIP_FILES.has(n.name)) {
      yield { path: p, uid: n.uid };
    }
  }
}

async function latestDeployment(project) {
  const r = await api(`/v9/projects/${project.projectId}`);
  const j = await r.json();
  return j.latestDeployments?.[0]?.id || j.targets?.production?.id || project.deploymentId;
}

async function pullProject(name, project) {
  const dir = path.join(PROJECTS_DIR, name);
  fs.mkdirSync(path.join(dir, '.vercel'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.vercel', 'project.json'), JSON.stringify({ projectId: project.projectId, orgId: TEAM_ID, projectName: name }, null, 2));
  let files;
  if (verifyOnly || !TOKEN) {
    const manifestPath = path.join(dir, 'MANIFEST.json');
    if (!fs.existsSync(manifestPath)) return console.log(`${name}: no manifest, skipped`);
    files = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files;
  } else {
    const dpl = await latestDeployment(project);
    const tree = await (await api(`/v6/deployments/${dpl}/files`)).json();
    const src = tree.find((n) => n.name === 'src' && n.type === 'directory');
    files = [...walk(src ? src.children : tree)];
    fs.writeFileSync(path.join(dir, 'MANIFEST.json'), JSON.stringify({ deploymentId: dpl, files }, null, 1));
    project.deploymentId = dpl;
  }
  let have = 0, got = 0, failed = 0;
  const queue = [...files];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift();
      const dest = path.join(dir, f.path);
      if (fs.existsSync(dest) && sha1(fs.readFileSync(dest)) === f.uid) { have++; continue; }
      if (verifyOnly || !TOKEN) { failed++; continue; }
      try {
        const r = await api(`/v8/deployments/${project.deploymentId}/files/${f.uid}`);
        const ct = r.headers.get('content-type') || '';
        let buf;
        if (ct.includes('application/json')) {
          const j = await r.json();
          buf = Buffer.from(j.data, 'base64');
        } else {
          buf = Buffer.from(await r.arrayBuffer());
        }
        if (sha1(buf) !== f.uid) throw new Error('sha1 mismatch');
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        got++;
      } catch (e) {
        failed++;
        console.error(`  ! ${name}/${f.path}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  console.log(`${name.padEnd(34)} files=${String(files.length).padStart(4)} present=${String(have).padStart(4)} downloaded=${String(got).padStart(4)} missing=${failed}`);
}

if (!TOKEN && !verifyOnly) {
  console.error('VERCEL_TOKEN is not set. Create one at https://vercel.com/account/tokens, then:\n  VERCEL_TOKEN=... node tools/pull-vercel-sources.mjs');
  process.exit(1);
}
for (const [name, project] of Object.entries(INVENTORY.projects)) {
  if (only.size && !only.has(name)) continue;
  if (project.source === 'git') continue; // this repository itself
  try { await pullProject(name, project); } catch (e) { console.error(`${name}: ${e.message}`); }
}
fs.writeFileSync(path.join(PROJECTS_DIR, 'inventory.json'), JSON.stringify(INVENTORY, null, 2));

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, realpath, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve('.');
const seedScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'seedWorkspace.js');
const snapshotScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'snapshot.js');

const runNodeScript = async (cwd, scriptAbsPath) => {
  return await execFileAsync(process.execPath, [scriptAbsPath], { cwd });
};

test('fs:snapshot writes snapshot.json with expected structure', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-snapshot-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, snapshotScriptAbsPath);

    const snapshotAbsPath = path.join(tmp, 'snapshot.json');
    const snapshot = JSON.parse(await readFile(snapshotAbsPath, 'utf8'));

    // macOS sometimes reports temp paths with /private prefix; compare by realpath.
    assert.equal(
      await realpath(snapshot.rootPath),
      await realpath(path.join(tmp, 'workspace')),
    );
    assert.ok(Array.isArray(snapshot.entries));

    // paths must be relative to workspace and use forward slashes
    assert.ok(snapshot.entries.every((e) => typeof e.path === 'string'));
    assert.ok(snapshot.entries.every((e) => !path.isAbsolute(e.path)));
    assert.ok(snapshot.entries.every((e) => !e.path.includes('\\')));

    const byPath = new Map(snapshot.entries.map((e) => [e.path, e]));

    assert.equal(byPath.get('parts')?.type, 'directory');

    const file1 = byPath.get('file1.txt');
    assert.equal(file1?.type, 'file');
    assert.equal(file1?.size, 64);
    assert.equal(typeof file1?.content, 'string');

    const decodedFile1Prefix = Buffer.from(file1.content, 'base64')
      .toString('utf8')
      .slice(0, 20);
    assert.equal(decodedFile1Prefix, 'file1.txt (64 bytes)');

    const nested = byPath.get('subdir1/subdir2/nested.txt');
    assert.equal(nested?.type, 'file');
    assert.equal(nested?.size, 32);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:snapshot throws FS operation failed when workspace is missing', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-snapshot-'));

  try {
    await assert.rejects(async () => {
      await runNodeScript(tmp, snapshotScriptAbsPath);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});


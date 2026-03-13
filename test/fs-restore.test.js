import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve('.');
const seedScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'seedWorkspace.js');
const snapshotScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'snapshot.js');
const restoreScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'restore.js');

const runNodeScript = async (cwd, scriptAbsPath) => {
  return await execFileAsync(process.execPath, [scriptAbsPath], { cwd });
};

test('fs:restore recreates workspace structure and file contents', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-restore-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, snapshotScriptAbsPath);
    await runNodeScript(tmp, restoreScriptAbsPath);

    const originalWorkspaceAbsPath = path.join(tmp, 'workspace');
    const restoredWorkspaceAbsPath = path.join(tmp, 'workspace_restored');

    const originalFile1 = await readFile(
      path.join(originalWorkspaceAbsPath, 'file1.txt'),
    );
    const restoredFile1 = await readFile(
      path.join(restoredWorkspaceAbsPath, 'file1.txt'),
    );
    assert.deepEqual(restoredFile1, originalFile1);

    const originalNested = await readFile(
      path.join(originalWorkspaceAbsPath, 'subdir1', 'subdir2', 'nested.txt'),
    );
    const restoredNested = await readFile(
      path.join(restoredWorkspaceAbsPath, 'subdir1', 'subdir2', 'nested.txt'),
    );
    assert.deepEqual(restoredNested, originalNested);

    assert.equal(
      await readFile(path.join(restoredWorkspaceAbsPath, 'parts', 'a.txt'), 'utf8'),
      'A\n',
    );
    assert.equal(
      await readFile(path.join(restoredWorkspaceAbsPath, 'parts', 'b.txt'), 'utf8'),
      'B\n',
    );
    assert.equal(
      await readFile(path.join(restoredWorkspaceAbsPath, 'parts', 'c.txt'), 'utf8'),
      'C\n',
    );
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:restore ignores snapshot.rootPath (treated as metadata)', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-restore-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, snapshotScriptAbsPath);

    const snapshotAbsPath = path.join(tmp, 'snapshot.json');
    const snapshot = JSON.parse(await readFile(snapshotAbsPath, 'utf8'));
    snapshot.rootPath = '/definitely/not/used';
    await writeFile(snapshotAbsPath, JSON.stringify(snapshot, null, 2));

    await runNodeScript(tmp, restoreScriptAbsPath);

    const restoredWorkspaceAbsPath = path.join(tmp, 'workspace_restored');
    const restoredFile1 = await readFile(
      path.join(restoredWorkspaceAbsPath, 'file1.txt'),
      'utf8',
    );
    assert.ok(restoredFile1.includes('file1.txt'));
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:restore throws FS operation failed when snapshot.json is missing', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-restore-'));

  try {
    await assert.rejects(async () => {
      await runNodeScript(tmp, restoreScriptAbsPath);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:restore throws FS operation failed when workspace_restored already exists', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-restore-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, snapshotScriptAbsPath);

    // Create destination folder beforehand
    await writeFile(path.join(tmp, 'workspace_restored'), 'not a directory');

    await assert.rejects(async () => {
      await runNodeScript(tmp, restoreScriptAbsPath);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});


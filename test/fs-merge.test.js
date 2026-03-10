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
const mergeScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'merge.js');

const runNodeScript = async (cwd, scriptAbsPath, args = []) => {
  return await execFileAsync(process.execPath, [scriptAbsPath, ...args], { cwd });
};

test('fs:merge default merges all .txt files in parts alphabetically', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-merge-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, mergeScriptAbsPath);

    const merged = await readFile(path.join(tmp, 'workspace', 'merged.txt'), 'utf8');
    assert.equal(merged, 'A\nB\nC\n');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:merge --files merges only requested files in provided order', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-merge-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);
    await runNodeScript(tmp, mergeScriptAbsPath, ['--files', 'c.txt,a.txt']);

    const merged = await readFile(path.join(tmp, 'workspace', 'merged.txt'), 'utf8');
    assert.equal(merged, 'C\nA\n');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:merge throws FS operation failed when parts folder is missing', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-merge-'));

  try {
    await assert.rejects(async () => {
      await runNodeScript(tmp, mergeScriptAbsPath);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:merge throws FS operation failed when parts contains no .txt files (default mode)', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-merge-'));

  try {
    // Create workspace/parts but no .txt files
    await writeFile(path.join(tmp, 'workspace', 'parts', 'a.md'), 'nope\n', {
      recursive: false,
    }).catch(async () => {
      // Ensure parent dirs exist; writeFile doesn't support recursive creation
      const { mkdir } = await import('node:fs/promises');
      await mkdir(path.join(tmp, 'workspace', 'parts'), { recursive: true });
      await writeFile(path.join(tmp, 'workspace', 'parts', 'a.md'), 'nope\n');
    });

    await assert.rejects(async () => {
      await runNodeScript(tmp, mergeScriptAbsPath);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:merge throws FS operation failed when a requested file is missing', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-merge-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);

    await assert.rejects(async () => {
      await runNodeScript(tmp, mergeScriptAbsPath, ['--files', 'missing.txt']);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});


import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve('.');
const seedScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'seedWorkspace.js');

const runSeed = async (cwd) => {
  await execFileAsync(process.execPath, [seedScriptAbsPath], { cwd });
};

test('fs:seed creates expected workspace fixture', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-seed-'));

  try {
    await runSeed(tmp);

    const workspaceAbsPath = path.join(tmp, 'workspace');
    const file1AbsPath = path.join(workspaceAbsPath, 'file1.txt');
    const nestedAbsPath = path.join(
      workspaceAbsPath,
      'subdir1',
      'subdir2',
      'nested.txt',
    );

    const partsDirAbsPath = path.join(workspaceAbsPath, 'parts');
    const aAbsPath = path.join(partsDirAbsPath, 'a.txt');
    const bAbsPath = path.join(partsDirAbsPath, 'b.txt');
    const cAbsPath = path.join(partsDirAbsPath, 'c.txt');

    assert.equal((await stat(file1AbsPath)).size, 64);
    assert.equal((await stat(nestedAbsPath)).size, 32);

    assert.equal(await readFile(aAbsPath, 'utf8'), 'A\n');
    assert.equal(await readFile(bAbsPath, 'utf8'), 'B\n');
    assert.equal(await readFile(cAbsPath, 'utf8'), 'C\n');
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:seed is idempotent (can be run twice)', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-seed-'));

  try {
    await runSeed(tmp);
    await runSeed(tmp);

    const file1AbsPath = path.join(tmp, 'workspace', 'file1.txt');
    assert.equal((await stat(file1AbsPath)).size, 64);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

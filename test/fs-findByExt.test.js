import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const repoRoot = path.resolve('.');
const seedScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'seedWorkspace.js');
const findByExtScriptAbsPath = path.join(repoRoot, 'src', 'fs', 'findByExt.js');

const runNodeScript = async (cwd, scriptAbsPath, args = []) => {
  return await execFileAsync(process.execPath, [scriptAbsPath, ...args], { cwd });
};

test('fs:findByExt lists .txt files sorted (default --ext txt behavior)', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-findByExt-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);

    const { stdout } = await runNodeScript(tmp, findByExtScriptAbsPath, [
      '--ext',
      'txt',
    ]);

    const lines = stdout
      .trim()
      .split('\n')
      .filter(Boolean);

    const expected = [
      'file1.txt',
      'parts/a.txt',
      'parts/b.txt',
      'parts/c.txt',
      'subdir1/subdir2/nested.txt',
    ];

    assert.deepEqual(lines, expected);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:findByExt lists files for a different extension', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-findByExt-'));

  try {
    await runNodeScript(tmp, seedScriptAbsPath);

    const workspaceAbsPath = path.join(tmp, 'workspace');
    await writeFile(path.join(workspaceAbsPath, 'z.js'), 'console.log(1)\n');
    await writeFile(
      path.join(workspaceAbsPath, 'subdir1', 'subdir2', 'a.js'),
      'console.log(2)\n',
    );

    const { stdout } = await runNodeScript(tmp, findByExtScriptAbsPath, [
      '--ext',
      'js',
    ]);

    const lines = stdout
      .trim()
      .split('\n')
      .filter(Boolean);

    assert.deepEqual(lines, ['subdir1/subdir2/a.js', 'z.js']);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});

test('fs:findByExt throws FS operation failed when workspace is missing', async () => {
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'node-nodejs-fs-findByExt-'));

  try {
    await assert.rejects(async () => {
      await runNodeScript(tmp, findByExtScriptAbsPath, ['--ext', 'txt']);
    }, /FS operation failed/);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
});


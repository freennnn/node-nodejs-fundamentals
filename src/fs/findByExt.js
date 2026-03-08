import fs from 'node:fs/promises';
import path from 'node:path';

const findByExt = async () => {

  const fail = () => {
    throw new Error('FS operation failed');
  };

  const rootDirAbsPath = path.resolve('workspace');

  const ensureWorkspaceExists = async () => {
    try {
      const st = await fs.stat(rootDirAbsPath);
      if (!st.isDirectory()) fail();
    } catch {
      fail();
    }
  };

  const parseExtFromCli = () => {
    const idx = process.argv.indexOf('--ext');
    if (idx === -1) return '.txt';
    const v = process.argv[idx + 1];
    if (!v || v === '--ext') return '.txt';
    return v.startsWith('.') ? v : `.${v}`;
  };

  const ext = parseExtFromCli();

  const toRelativePosixPath = (absPath) => {
    const rel = path.relative(rootDirAbsPath, absPath);
    return path.sep === '/' ? rel : rel.split(path.sep).join('/');
  };

  const collectMatches = async () => {
    const matches = [];

    const traverse = async (currentDirAbsPath) => {
      let dirents;
      try {
        dirents = await fs.readdir(currentDirAbsPath, { withFileTypes: true });
      } catch {
        fail();
      }

      for (const d of dirents) {
        const abs = path.join(currentDirAbsPath, d.name);
        if (d.isDirectory()) {
          await traverse(abs);
          continue;
        }
        if (d.isFile() && path.extname(d.name) === ext) {
          matches.push(toRelativePosixPath(abs));
        }
      }
    };

    await traverse(rootDirAbsPath);
    return matches;
  };

  await ensureWorkspaceExists();
  const matches = await collectMatches();
  matches.sort((a, b) => a.localeCompare(b));

  process.stdout.write(matches.join('\n') + (matches.length ? '\n' : ''));
};

await findByExt();

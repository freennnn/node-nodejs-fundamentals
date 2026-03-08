import fs from 'node:fs/promises';
import path from 'node:path';

const snapshot = async () => {

  const workspacePath = path.resolve('workspace');
  const snapshotPath = path.resolve('snapshot.json');

  const fail = () => {
    throw new Error('FS operation failed');
  };

  const ensureWorkspaceExists = async () => {
    try {
      const st = await fs.stat(workspacePath);
      if (!st.isDirectory()) fail();
    } catch {
      fail();
    }
  };

  // on Windows switches '\' to '/', no op on Mac
  const toRelativePosixPath = (absPath) => {
    const rel = path.relative(workspacePath, absPath);
    return path.sep === '/' ? rel : rel.split(path.sep).join('/');
  };

  const collectEntries = async (startDirAbsPath) => {
    const entries = [];

    const traverse = async (currentDirAbsPath) => {
      let dirents;
      try {
        dirents = await fs.readdir(currentDirAbsPath, { withFileTypes: true });
      } catch {
        fail();
      }

      for (const d of dirents) {
        const abs = path.join(currentDirAbsPath, d.name);
        const rel = toRelativePosixPath(abs);

        if (d.isDirectory()) {
          entries.push({ path: rel, type: 'directory' });
          await traverse(abs);
          continue;
        }

        if (d.isFile()) {
          let st;
          let buf;
          try {
            st = await fs.stat(abs);
            buf = await fs.readFile(abs);
          } catch {
            fail();
          }

          entries.push({
            path: rel,
            type: 'file',
            size: st.size,
            content: buf.toString('base64'),
          });
        }
      }
    };

    await traverse(startDirAbsPath);
    return entries;
  };

  await ensureWorkspaceExists();
  const entries = await collectEntries(workspacePath);
  entries.sort((a, b) => a.path.localeCompare(b.path));

  const payload = { rootPath: workspacePath, entries };

  try {
    await fs.writeFile(snapshotPath, JSON.stringify(payload, null, 2));
  } catch {
    fail();
  }
};

await snapshot();

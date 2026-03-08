import fs from 'node:fs/promises';
import path from 'node:path';

const seedWorkspace = async () => {
  const workspaceAbsPath = path.resolve('workspace');

  const makeSizedBuffer = (humanReadablePrefix, sizeInBytes) => {
    const prefix = Buffer.from(humanReadablePrefix, 'utf8');
    const buf = Buffer.alloc(sizeInBytes, 0x20); // space padding
    prefix.subarray(0, Math.min(prefix.length, buf.length)).copy(buf);
    return buf;
  };

  await fs.mkdir(workspaceAbsPath, { recursive: true });
  await fs.mkdir(path.join(workspaceAbsPath, 'subdir'), { recursive: true });

  // Use fixed byte sizes to match the README example (size is computed from bytes).
  await fs.writeFile(
    path.join(workspaceAbsPath, 'file1.txt'),
    makeSizedBuffer('file1.txt (1024 bytes)\n', 1024),
  );
  await fs.writeFile(
    path.join(workspaceAbsPath, 'subdir', 'nested.txt'),
    makeSizedBuffer('nested.txt (512 bytes)\n', 512),
  );

  // Optional: seed parts for merge task.
  await fs.mkdir(path.join(workspaceAbsPath, 'parts'), { recursive: true });
  await fs.writeFile(path.join(workspaceAbsPath, 'parts', 'a.txt'), 'A\n');
  await fs.writeFile(path.join(workspaceAbsPath, 'parts', 'b.txt'), 'B\n');
};

await seedWorkspace();

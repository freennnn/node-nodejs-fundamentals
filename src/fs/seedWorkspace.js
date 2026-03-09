import fs from 'node:fs/promises'
import path from 'node:path'

const seedWorkspace = async () => {
  const workspaceAbsPath = path.resolve('workspace')

  const makeSizedBuffer = (humanReadablePrefix, sizeInBytes) => {
    const prefix = Buffer.from(humanReadablePrefix, 'utf8')
    const buf = Buffer.alloc(sizeInBytes, 0x20) // space padding
    prefix.subarray(0, Math.min(prefix.length, buf.length)).copy(buf)
    return buf
  }

  await fs.mkdir(workspaceAbsPath, { recursive: true })
  const subdirPath = path.join(workspaceAbsPath, 'subdir1', 'subdir2')
  await fs.mkdir(subdirPath, { recursive: true })

  // Use fixed byte sizes to match the README example (size is computed from bytes).
  await fs.writeFile(
    path.join(workspaceAbsPath, 'file1.txt'),
    makeSizedBuffer('file1.txt (64 bytes)\n', 64),
  )
  await fs.writeFile(
    path.join(subdirPath, 'nested.txt'),
    makeSizedBuffer('nested.txt (32 bytes)\n', 32),
  )

  // Optional: seed parts for merge task.
  const partsPath = path.join(workspaceAbsPath, 'parts')
  await fs.mkdir(partsPath, { recursive: true })
  await fs.writeFile(path.join(partsPath, 'a.txt'), 'A\n')
  await fs.writeFile(path.join(partsPath, 'b.txt'), 'B\n')
  await fs.writeFile(path.join(partsPath, 'c.txt'), 'C\n')
}

await seedWorkspace()

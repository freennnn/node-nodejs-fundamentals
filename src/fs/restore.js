import fs from 'node:fs/promises'
import path from 'node:path'

const restore = async () => {
  const snapshotPath = path.resolve('snapshot.json')
  const restoredRoot = path.resolve('workspace_restored')

  const fail = () => {
    throw new Error('FS operation failed')
  }

  const ensureSnapshotExists = async () => {
    try {
      const st = await fs.stat(snapshotPath)
      if (!st.isFile()) fail()
    } catch {
      fail()
    }
  }

  const ensureRestoredDoesNotExist = async () => {
    try {
      await fs.stat(restoredRoot)
      fail() // already exists (file or dir)
    } catch (e) {
      if (e && e.code === 'ENOENT') return
      fail()
    }
  }

  const parseSnapshot = async () => {
    try {
      const raw = await fs.readFile(snapshotPath, 'utf8')
      const json = JSON.parse(raw)
      if (!json || typeof json !== 'object') fail()
      if (!Array.isArray(json.entries)) fail()
      return json
    } catch {
      fail()
    }
  }

  // Protect against malicious relative paths like "../../outside.text" or absolute paths "/etc/passwd"
  const ensureInsideRestoreRoot = (targetAbs) => {
    const rel = path.relative(restoredRoot, targetAbs)
    if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) fail()
  }
  await ensureSnapshotExists()
  await ensureRestoredDoesNotExist()

  const snapshot = await parseSnapshot()

  try {
    await fs.mkdir(restoredRoot, { recursive: false })
  } catch {
    fail()
  }

  // Ensure deterministic restore order.
  const entries = [...snapshot.entries].sort((a, b) =>
    String(a.path).localeCompare(String(b.path)),
  )

  for (const e of entries) {
    if (!e || typeof e !== 'object') fail()
    if (typeof e.path !== 'string') fail()
    if (e.path.includes('\0')) fail()

    const destAbs = path.resolve(restoredRoot, e.path)
    ensureInsideRestoreRoot(destAbs)

    if (e.type === 'directory') {
      try {
        await fs.mkdir(destAbs, { recursive: true })
      } catch {
        fail()
      }
      continue
    }

    if (e.type === 'file') {
      if (typeof e.content !== 'string') fail()
      if (typeof e.size !== 'number') fail()

      try {
        await fs.mkdir(path.dirname(destAbs), { recursive: true })
        const buf = Buffer.from(e.content, 'base64')
        await fs.writeFile(destAbs, buf)
      } catch {
        fail()
      }
      continue
    }

    fail()
  }
}

await restore()

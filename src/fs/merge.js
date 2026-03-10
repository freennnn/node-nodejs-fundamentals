import fs from 'node:fs/promises'
import path from 'node:path'

const merge = async () => {
  const fail = () => {
    throw new Error('FS operation failed')
  }

  const rootDirAbsPath = path.resolve('workspace')
  const partsDirAbsPath = path.join(rootDirAbsPath, 'parts')
  const mergedFileAbsPath = path.join(rootDirAbsPath, 'merged.txt')

  const ensurePartsDirExists = async () => {
    try {
      const st = await fs.stat(partsDirAbsPath)
      if (!st.isDirectory()) fail()
    } catch {
      fail()
    }
  }

  const parseFilesFromCli = () => {
    const idx = process.argv.indexOf('--files')
    if (idx === -1) return null
    const v = process.argv[idx + 1]
    if (!v || v.startsWith('--')) return null
    const arr = v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    return arr.length ? arr : null
  }

  const listDefaultTxtFiles = async () => {
    let dirents
    try {
      dirents = await fs.readdir(partsDirAbsPath, { withFileTypes: true })
    } catch {
      fail()
    }

    const files = dirents
      .filter((d) => d.isFile() && path.extname(d.name) === '.txt')
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b))

    if (files.length === 0) fail()
    return files
  }

  const ensureFileExists = async (absPath) => {
    try {
      const st = await fs.stat(absPath)
      if (!st.isFile()) fail()
    } catch {
      fail()
    }
  }

  await ensurePartsDirExists()

  const requested = parseFilesFromCli()
  const files = requested ?? (await listDefaultTxtFiles())

  const chunks = []
  for (const name of files) {
    const abs = path.join(partsDirAbsPath, name)
    await ensureFileExists(abs)
    try {
      chunks.push(await fs.readFile(abs, 'utf8'))
    } catch {
      fail()
    }
  }

  try {
    await fs.writeFile(mergedFileAbsPath, chunks.join(''))
  } catch {
    fail()
  }
}

await merge()

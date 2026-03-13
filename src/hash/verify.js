import path from 'node:path'
import url from 'node:url'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import crypto from 'node:crypto'

const verify = async () => {
  // Write your code here
  // Read checksums.json
  // Calculate SHA256 hash using Streams API
  // Print result: filename — OK/FAIL

  function fail() {
    throw new Error('FS operation failed')
  }

  let checksumPath = path.join(
    path.dirname(url.fileURLToPath(import.meta.url)),
    'checksums.json',
  )

  async function ensureChecksumExists() {
    try {
      const st = await fsp.stat(checksumPath)
      if (!st.isFile()) fail()
    } catch {
      fail()
    }
  }

  async function calculateHash(filePath) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath)
      const hash = crypto.createHash('sha256')

      stream.on('data', (chunk) => {
        hash.update(chunk)
      })
      stream.on('end', () => {
        resolve(hash.digest('hex'))
      })
      stream.on('error', (er) => reject(er))
    })
  }

  await ensureChecksumExists()

  let checksumContent
  try {
    checksumContent = await fsp.readFile(checksumPath, 'utf8')
  } catch {
    fail()
  }

  let checksumJSON
  try {
    checksumJSON = JSON.parse(checksumContent)
  } catch {
    fail()
  }

  if (
    !checksumJSON ||
    typeof checksumJSON !== 'object' ||
    Array.isArray(checksumJSON)
  ) {
    fail()
  }

  for (let [key, value] of Object.entries(checksumJSON)) {
    const filePath = path.join(
      path.dirname(url.fileURLToPath(import.meta.url)),
      key,
    )
    let ok = false
    try {
      const fileHash = await calculateHash(filePath)
      ok = fileHash === value
    } catch {
      ok = false
    }

    console.log(`${key} — ${ok ? 'OK' : 'FAIL'}`)
  }
}

await verify()

import process from 'node:process'

const dynamic = async () => {
  function parseCLIParameter() {
    const args = process.argv.slice(2) // user args when running node script directly
    return args[0] ?? null
  }

  const moduleName = parseCLIParameter()
  if (!moduleName) {
    console.log('Plugin not found')
    process.exitCode = 1
    return
  }

  const pluginUrl = new URL(`./plugins/${moduleName}.js`, import.meta.url)

  let plugin
  try {
    plugin = await import(pluginUrl.href)
  } catch (e) {
    // Expected failure: plugin module doesn't exist.
    if (e && typeof e === 'object' && e.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('Plugin not found')
      process.exitCode = 1
      return
    }
    throw e
  }

  if (!plugin || typeof plugin.run !== 'function') {
    throw new Error('Invalid plugin module')
  }

  const result = plugin.run()
  console.log(result)
}

await dynamic()

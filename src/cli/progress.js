const progress = () => {
  const parseNumber = (v, fallback) => {
    const n = Number(v)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  const getArgValue = (name) => {
    const idx = process.argv.indexOf(name)
    if (idx === -1) return undefined
    const v = process.argv[idx + 1]
    if (!v || v.startsWith('--')) return undefined
    return v
  }

  const duration = parseNumber(getArgValue('--duration'), 5000)
  const interval = parseNumber(getArgValue('--interval'), 100)
  const length = Math.floor(parseNumber(getArgValue('--length'), 30))

  const colorArg = getArgValue('--color')
  const colorMatch =
    typeof colorArg === 'string' ? colorArg.match(/^#([0-9a-fA-F]{6})$/) : null
  const colorHex = colorMatch ? colorMatch[1] : null

  const toRgb = (hex6) => {
    const r = Number.parseInt(hex6.slice(0, 2), 16)
    const g = Number.parseInt(hex6.slice(2, 4), 16)
    const b = Number.parseInt(hex6.slice(4, 6), 16)
    return { r, g, b }
  }

  /**
   * Colorizes a string using 24-bit RGB ANSI escape sequences.
   *
   * Explanation:
   * - We accept input as a hex string like "#ff0000" for red.
   * - The code extracts the 6-digit hex (e.g., "ff0000").
   * - Then, `toRgb` turns "ff0000" into its red/green/blue values: {r: 255, g: 0, b: 0}.
   * - Finally, we construct an ANSI escape sequence: \x1b[38;2;R;G;Bm
   *   - 38 means "set foreground color"
   *   - 2 means "use 24-bit color" (not 16-color or 256-color)
   * - This only works in terminals that support "true color" (24-bit), otherwise the color may not show, or the text may look like the default color (often white).
   * - After the colored section, it ends with \x1b[0m to reset coloring.
   */
  const colorize = (text) => {
    if (!colorHex) return text
    const { r, g, b } = toRgb(colorHex)
    return `\x1b[38;2;${r};${g};${b}m${text}\x1b[0m`
  }

  const barChar = '█'
  const emptyChar = ' '

  const render = (percent) => {
    const clamped = Math.max(0, Math.min(100, percent))
    const filled = Math.round((clamped / 100) * length)
    const empty = Math.max(0, length - filled)

    const filledPart = barChar.repeat(filled)
    const emptyPart = emptyChar.repeat(empty)

    const bar = `[${colorize(filledPart)}${emptyPart}] ${Math.round(clamped)}%`

    process.stdout.write(`\r${bar}`)
  }

  const start = Date.now()

  render(0)

  const timer = setInterval(
    () => {
      const elapsed = Date.now() - start
      const percent = duration === 0 ? 100 : (elapsed / duration) * 100

      if (percent >= 100) {
        clearInterval(timer)
        render(100)
        process.stdout.write('\nDone!\n')
        return
      }

      render(percent)
    },
    Math.max(1, interval),
  )
}

progress()

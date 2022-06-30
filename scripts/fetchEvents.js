const { readFile, writeFile } = require("fs/promises")
const { join } = require("path")

async function fetchEvents() {
  const file = await readFile(
    join(require.resolve("discord.js"), "..", "..", "typings", "index.d.ts"),
    "utf8"
  )

  const rawMatch =
    /\nexport\sinterface\sClientEvents\sextends\sBaseClientEvents\s\{\n(.+?)\n}\n\n/s.exec(
      file
    )

  if (!rawMatch) throw new Error("Error while fetching ClientEvents...")

  const raw = rawMatch[1].replace(/<.+?>/g, "")

  const lineRegex = /$\s+([a-z]+):\s\[(.+?)];/gims

  const events = {}

  let lineMatch
  while ((lineMatch = lineRegex.exec(raw)) !== null) {
    const [, eventName, rawParams] = lineMatch

    events[eventName] = rawParams
      .split(",")
      .map((raw) => raw.trim())
      .filter((raw) => raw.length > 3)
      .map((raw) => raw.split(":")[0])
  }

  await writeFile(
    join(__dirname, "..", "src", "events.json"),
    JSON.stringify(events)
  )
}

fetchEvents().then(console.log).catch(console.error)

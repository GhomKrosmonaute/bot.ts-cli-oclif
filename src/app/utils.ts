import cp from "child_process"
import { join } from "path"
import { CliUx } from "@oclif/core"
import { ClientEvents } from "discord.js"
import { writeFile, readFile } from "fs/promises"
import { grey, redBright, green, blueBright } from "chalk"
import { validateNpm } from "is-valid-package-name"
import figlet from "figlet"

export function getBotPath(...segment: string[]) {
  return join(process.cwd(), context.botName ?? "", ...segment)
}

export function getCliPath(...segments: string[]) {
  return join(__dirname, "..", "..", ...segments)
}

export async function readJSON(path: string) {
  return JSON.parse(await readFile(path, "utf8"))
}

export async function writeJSON(path: string, json: object) {
  await writeFile(path, JSON.stringify(json, null, 2), "utf8")
}

export async function useTemplate(
  templateName: string,
  replacers: Record<string, string>,
  path: string
) {
  let template = await readFile(getCliPath("files", templateName), "utf-8")

  for (const pattern in replacers) {
    const replacer = replacers[pattern]

    template = template.replace(new RegExp(`{{ ${pattern} }}`, "g"), replacer)
  }

  await writeFile(path, template)
}

export function colorizeCommand(command: string): string {
  return `${grey("$")} ${command
    .split(/\s+/)
    .map((part, i) => {
      return i === 0
        ? redBright(part)
        : part.includes("[")
        ? grey(part)
        : part.includes('"') || part.includes(".")
        ? green(part)
        : part
    })
    .join(" ")}`
}

export async function printTitle(text: string) {
  CliUx.ux.log(
    blueBright(
      await new Promise<string>((resolve) =>
        figlet(text, (err, value) => {
          if (err) resolve("")
          else resolve(value as string)
        })
      )
    )
  )
}

export async function checkMode() {
  const pkg = await readJSON(getBotPath("package.json"))
  context.mode = pkg.d
}

export async function injectEnvLine(name: string, value: string) {
  const env = await readFile(getBotPath(".env"), "utf8")
  const lines = env.split("\n")
  const index = lines.findIndex((line) => line.split("=")[0] === name)

  if (index > -1) lines.splice(index, 1)

  lines.push(`${name}="${value}"`)

  await writeFile(getBotPath(".env"), lines.join("\n"), "utf8")
}

export async function loader(message: string, callback: () => unknown) {
  const time = Date.now()

  CliUx.ux.action.start(message)

  await callback()

  CliUx.ux.action.stop(`done. ${grey(`${Date.now() - time}ms`)}`)
}

export async function exec(
  cmd: string,
  options?: cp.CommonOptions
): Promise<null> {
  return new Promise((res, rej) => {
    cp.exec(cmd, options, (err) => {
      if (err) rej(err)
      else res(null)
    })
  })
}

export function validateNameInput(name: string): true | never {
  if (name.length < 2) {
    return CliUx.ux.error("The bot name must be longer than 1")
  }

  const [isValid, reason] = validateNpm(name)

  if (!isValid) {
    return CliUx.ux.error(reason)
  }

  return true
}

export async function isOnBotDir(): Promise<boolean> {
  try {
    const pkg = await readJSON(getBotPath("package.json"))
    return (
      pkg.devDependencies.hasOwnProperty("@ghom/create-bot.ts") ||
      pkg.devDependencies.hasOwnProperty("make-bot.ts")
    )
  } catch (err) {
    return false
  }
}

export const locales = ["en", "fr", "es", "de", "ja"]

export const borderNone = {
  top: " ",
  left: " ",
  right: " ",
  bottom: " ",
  topLeft: " ",
  topRight: " ",
  bottomLeft: " ",
  bottomRight: " ",
  horizontal: " ",
  vertical: " ",
}

export const context: {
  botName?: string
  mode: Mode
} = {
  mode: "options",
}

export type Mode = "chains" | "options"

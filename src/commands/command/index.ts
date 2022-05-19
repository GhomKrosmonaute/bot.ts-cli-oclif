// make command [name:string] --chain:boolean

import {
  checkMode,
  context,
  getBotPath,
  isOnBotDir,
  printTitle,
  useTemplate,
  validateNameInput,
} from "../../app/utils"
import { CliUx, Command } from "@oclif/core"
import { blueBright, green, grey } from "chalk"
import { join, relative } from "path"

export default class CreateCommand extends Command {
  static args = [{ name: "name" }]

  async run() {
    const { args } = await this.parse(CreateCommand)

    if (!(await isOnBotDir()))
      return CliUx.ux.error("You are not in a bot.ts folder")

    await checkMode()
    await printTitle("bot.ts")

    const name =
      args.name ??
      (await CliUx.ux.prompt(
        `${green("?")} What is the name of your ${blueBright("new command")}?`,
        { required: true }
      ))

    if (!validateNameInput(name)) return

    const commandPath = getBotPath("src", "commands", `${name}.ts`)

    await useTemplate(
      (context.mode === "chains" ? "chain_" : "") + "command",
      {
        name,
        Name: name[0].toUpperCase() + name.slice(1),
      },
      commandPath
    )

    CliUx.ux.log(
      `${green("√")} Successfully generated the ${blueBright(
        name
      )} command.\n${grey("=>")} ${blueBright(relative(__dirname, commandPath))}
      `
    )
  }
}

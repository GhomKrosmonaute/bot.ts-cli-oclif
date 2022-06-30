// make listener [event:string]

import {
  context,
  checkMode,
  getBotPath,
  isOnBotDir,
  printTitle,
  useTemplate,
  validateNameInput,
} from "../../app/utils"
import { CliUx, Command, Flags } from "@oclif/core"
import { blueBright, green, grey } from "chalk"
import { join, relative } from "path"

export default class CreateListener extends Command {
  static args = [{ name: "event" }]

  static flags = {
    name: Flags.string({ options: [] }),
  }

  async run() {
    const { args } = await this.parse(CreateListener)

    // todo: finish that

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

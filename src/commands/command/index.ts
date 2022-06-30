// make command [name:string]

import {
  context,
  checkMode,
  getBotPath,
  isOnBotDir,
  printTitle,
  useTemplate,
  validateFilename,
  displayPath,
  alreadyExists,
} from "../../app/utils"
import { CliUx, Command } from "@oclif/core"
import { blueBright, green } from "chalk"

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

    if (!validateFilename(name)) return

    const commandPath = getBotPath("src", "commands", `${name}.ts`)

    if (alreadyExists(commandPath)) return

    await useTemplate(
      (context.mode === "chains" ? "chain_" : "") + "command",
      {
        name,
        Name: name[0].toUpperCase() + name.slice(1),
      },
      commandPath
    )

    CliUx.ux.log(
      `${green("√")} Successfully generated the ${blueBright(name)} command.
${displayPath(commandPath)}
      `
    )
  }
}

// make command [name:string] --chain:boolean

import {
  checkMode,
  context,
  getBotPath,
  printTitle,
  useTemplate,
  validateNameInput,
} from "../../app/utils"
import { CliUx, Command, Flags } from "@oclif/core"
import { blueBright, green } from "chalk"

export default class CreateCommand extends Command {
  static args = [{ name: "name" }]

  async run() {
    const { args } = await this.parse(CreateCommand)

    await checkMode()
    await printTitle("bot.ts")

    const name =
      args.name ??
      (await CliUx.ux.prompt(
        `${green("?")} What is the name of your ${blueBright("new command")}?`,
        { required: true }
      ))

    if (!validateNameInput(name)) return

    await useTemplate(
      (context.mode === "chains" ? "chain_" : "") + "command",
      {
        name,
        Name: name[0].toUpperCase() + name.slice(1),
      },
      getBotPath("src", "commands", `${name}.ts`)
    )

    CliUx.ux.log(
      `${green("√")} Successfully generated the ${blueBright(name)} command.`
    )
  }
}

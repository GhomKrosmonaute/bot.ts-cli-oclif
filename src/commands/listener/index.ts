// make listener [event:string]

import {
  context,
  events,
  checkMode,
  getBotPath,
  isOnBotDir,
  printTitle,
  useTemplate,
  validateFilename,
  displayPath,
  alreadyExists,
} from "../../app/utils"
import { CliUx, Command, Flags } from "@oclif/core"
import { blueBright, green } from "chalk"
import { ClientEvents } from "discord.js"
import { prompt } from "inquirer"

export default class CreateListener extends Command {
  static args = [{ name: "event", options: Object.keys(events) }]

  static flags = {
    name: Flags.string(),
  }

  async run() {
    const { args, flags } = await this.parse(CreateListener)

    if (!(await isOnBotDir()))
      return CliUx.ux.error("You are not in a bot.ts folder")

    await checkMode()
    await printTitle("bot.ts")

    if (context.mode === "chains")
      throw new Error("chain listeners are not yet implemented.")

    const event: keyof ClientEvents =
      args.event ??
      ((
        await prompt([
          {
            type: "list",
            name: "event",
            message: `Please choose event you want to listen to:`,
            choices: Object.keys(events).map((name) => ({ name })),
          },
        ])
      ).event as string)

    const name =
      flags.name ??
      (await CliUx.ux.prompt(
        `${green("?")} What is the file name of your ${blueBright(
          "new listener"
        )}?`
      )) ??
      event

    if (!validateFilename(name)) return

    const listenerPath = getBotPath("src", "listeners", `${name}.ts`)

    if (alreadyExists(listenerPath)) return

    await useTemplate(
      "listener",
      {
        event,
        params: events[event].join(", "),
      },
      listenerPath
    )

    CliUx.ux.log(
      `${green("√")} Successfully generated the ${blueBright(name)} listener.
${displayPath(listenerPath)}
      `
    )
  }
}

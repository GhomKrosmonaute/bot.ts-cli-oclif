import { CliUx, Command, Flags } from "@oclif/core"
import { blueBright, green, grey, bgBlack, red } from "chalk"
import { Client } from "discord.js"
import { prompt } from "inquirer"
import Listr from "listr"

import {
  colorizeCommand,
  context,
  exec,
  getBotPath,
  isOnBotDir,
  locales,
  Mode,
  printTitle,
  validateNameInput,
} from "../../app/utils"
import { download, initialize, setupDatabase } from "../../app/actions"
import { Database, databases } from "../../app/database"

export class CreateBot extends Command {
  static args = [{ name: "name" }]

  static flags = {
    token: Flags.string({ char: "t" }),
    locale: Flags.string({ char: "l", options: locales }),
    prefix: Flags.string({ char: "p" }),
    manager: Flags.string({ char: "m", options: ["npm", "yarn", "pnpm"] }),
    database: Flags.string({ options: databases.map((db) => db.name) }),
    codeStyle: Flags.string({
      options: ["options", "chains"],
      default: "options",
    }),
  }

  async run() {
    await printTitle("bot.ts")

    const { flags, args } = await this.parse(CreateBot)

    if (await isOnBotDir()) {
      if (
        !(await CliUx.ux.confirm(
          `${green("?")} ${red(
            "You are currently in a bot folder"
          )}, are you sure you want to continue?`
        ))
      )
        return
    }

    context.mode = flags.codeStyle as Mode

    const name =
      args.name ??
      (await CliUx.ux.prompt(`What is the ${blueBright("bot name")} ?`, {
        required: true,
        default: "bot.ts",
      }))

    if (!validateNameInput(name)) return

    context.botName = name

    if (
      !(await CliUx.ux.confirm(
        `${green(
          "?"
        )} Do you really want to create your project in the following directory?\n${blueBright(
          getBotPath()
        )} ${grey("[y/n]")}`
      ))
    )
      return process.exit(0)

    const databaseName =
      flags.database ??
      ((
        await prompt([
          {
            type: "list",
            name: "database",
            message: `Please choose a ${blueBright("database")}:`,
            default: databases[0].name,
            choices: databases.map((db) => ({
              name: db.name,
            })),
          },
        ])
      ).database as string)

    const database = databases.find(
      (db) => db.name === databaseName
    ) as Database

    const databaseEnv: Record<string, string> = {}

    if (Object.keys(database.defaults).length > 0) {
      CliUx.ux.log(`Now we will ${blueBright("prepare the database")}.`)

      for (const name in database.defaults) {
        const def = database.defaults[name]

        databaseEnv[`DB_${name.toUpperCase()}`] = await CliUx.ux.prompt(
          `${grey("=>")} What is the ${blueBright(name)}?`,
          {
            required: !!def,
            default: def ?? undefined,
            type: name === "password" ? "hide" : "normal",
          }
        )
      }
    }

    const token =
      flags.token ??
      (await CliUx.ux.prompt(
        `${green("?")} Now put your ${blueBright("Discord app token")}`,
        { required: true, type: "mask" }
      ))

    {
      const client = new Client<true>({ intents: [] })

      try {
        await client.login(token)
      } catch (error) {
        return this.error("Invalid token given")
      }

      client.destroy()
    }

    const prefix =
      flags.prefix ??
      (await CliUx.ux.prompt(
        `${green("?")} There is still the ${blueBright(
          "prefix"
        )} to configure!`,
        {
          required: true,
          default: "!",
        }
      ))

    const locale =
      flags.locale ??
      ((
        await prompt([
          {
            type: "list",
            name: "locale",
            message: `Then, choose the default ${blueBright("locale")}:`,
            default: "en",
            choices: locales,
          },
        ])
      ).locale as string)

    const manager =
      flags.manager ??
      ((
        await prompt([
          {
            type: "list",
            name: "manager",
            message: `Which ${blueBright(
              "package manager"
            )} bot.ts should use?`,
            default: "npm",
            choices: ["npm", "yarn", "pnpm"],
          },
        ])
      ).manager as string)

    CliUx.ux.log("")

    const tasks = new Listr([
      {
        title: "Download bot.ts",
        task: () =>
          download(flags.codeStyle === "options" ? "master" : "design").then(
            () => "Done"
          ),
      },
      {
        title: "Initialize bot.ts",
        task: () =>
          initialize(token, prefix, locale, databaseEnv)
            .then(() => setupDatabase(databaseName))
            .then(() => "Done"),
      },
      {
        title: "Install bot.ts",
        task: () =>
          exec(`${manager} install`, { cwd: getBotPath() }).then(() => "Done"),
      },
    ])

    await tasks.run()

    await printTitle(name)

    const runCommand = manager === "npm" ? "npm run" : manager

    this.log(`
  ${grey("# to quickly create a new file")}
    ${colorizeCommand("create command [name]")}
    ${colorizeCommand("create listener [ClientEvent]")}
    ${colorizeCommand("create namespace [name]")}
    ${colorizeCommand("create table [name]")}

  ${grey("# to watch typescript and reload " + name)}
    ${colorizeCommand(runCommand + " watch")}

  ${grey("# to build typescript and start " + name)}
    ${colorizeCommand(runCommand + " start")}

  ${grey("# to simply start " + name)}
    ${colorizeCommand("node .")}

  ${grey("# to format your files with prettier")}
    ${colorizeCommand(runCommand + " format")}

  ${grey("# to update the bot.ts framework")}
    ${colorizeCommand(runCommand + " update")}

${green("√")} Successfully generated your bot.
${grey(
  "Before using create-bot.ts scripts, go to the bot folder with"
)} ${bgBlack(colorizeCommand(`cd ${name}`))}
Online documentation:${blueBright.underline(
      " https://ghom.gitbook.io/bot-ts/ "
    )}
    `)

    process.exit(0)
  }
}

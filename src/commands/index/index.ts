import { Command, CliUx, Flags } from "@oclif/core";
import { validateNpm } from "is-valid-package-name";
import { blueBright, grey } from "chalk";
import { Client } from "discord.js";
import { prompt } from "inquirer";
import figlet from "figlet";
//import boxen from "boxen";
import Listr from "listr";

import {
  borderNone,
  colorizeCommand,
  exec,
  getBotPath,
  injectEnvLine,
  locales,
} from "../../app/utils";
import { setupDatabase, initialize } from "../../app/actions";
import { Database, databases } from "../../app/database";

export class CreateBot extends Command {
  static flags = {
    name: Flags.string({ char: "n" }),
    token: Flags.string({ char: "t" }),
    locale: Flags.string({ char: "l", options: locales }),
    prefix: Flags.string({ char: "p" }),
    manager: Flags.string({ char: "m", options: ["npm", "yarn", "pnpm"] }),
    database: Flags.string({ options: databases.map((db) => db.name) }),
    codeStyle: Flags.string({
      options: ["options", "chain"],
      default: "options",
    }),
  };

  async run() {
    console.log(
      //boxen(
      blueBright(
        await new Promise<string>((resolve) =>
          figlet("bot.ts", (err, value) => {
            if (err) resolve("");
            else resolve(value as string);
          })
        )
      )
      //   {
      //     float: "center",
      //     borderStyle: borderNone,
      //   }
      // )
    );

    const { flags } = await this.parse(CreateBot);

    const name =
      flags.name ??
      (await CliUx.ux.prompt(`What is the ${blueBright("bot name")} ?`, {
        required: true,
        default: "bot.ts",
      }));

    {
      if (name.length < 2) {
        return this.error("The bot name must be longer than 1");
      }

      const [isValid, reason] = validateNpm(name);

      if (!isValid) {
        return this.error(reason);
      }
    }

    if (
      !(await CliUx.ux.confirm(
        `Do you really want to create your project in the following directory?\n${blueBright(
          getBotPath(name)
        )} ${grey("[y/N]")}`
      ))
    )
      return process.exit(0);

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
      ).database as string);

    const database = databases.find(
      (db) => db.name === databaseName
    ) as Database;

    const databaseEnv: Record<string, string> = {};

    if (Object.keys(database.defaults).length > 0) {
      CliUx.ux.log(`Now we will ${blueBright("prepare the database")}.`);

      for (const name in database.defaults) {
        const def = database.defaults[name];

        const value = await CliUx.ux.prompt(
          `${grey("==>")} What is the ${blueBright(name)}?`,
          {
            required: !!def,
            default: def ?? undefined,
            type: name === "password" ? "hide" : "normal",
          }
        );

        databaseEnv[`DB_${name.toUpperCase()}`] = value;
      }
    }

    const token =
      flags.token ??
      (await CliUx.ux.prompt(
        `Now put your ${blueBright("Discord app token")}`,
        { required: true, type: "mask" }
      ));

    {
      const client = new Client<true>({ intents: [] });

      try {
        await client.login(token);
      } catch (error) {
        return this.error("Invalid token given");
      }

      client.destroy();
    }

    const prefix =
      flags.prefix ??
      (await CliUx.ux.prompt("There is still the prefix to configure!", {
        required: true,
        default: "!",
      }));

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
      ).locale as string);

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
      ).manager as string);

    CliUx.ux.log("");

    const tasks = new Listr([
      {
        title: "Download bot.ts",
        task: () =>
          exec(
            [
              "git clone",
              "--depth=1",
              "--single-branch",
              "--branch=" +
                (flags.codeStyle === "options" ? "master" : "design"),
              "https://github.com/CamilleAbella/bot.ts.git",
              `"${name}"`,
            ].join(" ")
          ).then(() => "Done"),
      },
      {
        title: "Initialize bot.ts",
        task: () =>
          initialize(name, token, prefix, locale, databaseEnv).then(
            () => "Done"
          ),
      },
      {
        title: "Init database file",
        task: () => setupDatabase(name, databaseName).then(() => "Done"),
      },
      {
        title: "Install dependencies",
        task: () =>
          exec(
            manager === "yarn"
              ? "yarn install"
              : manager === "npm"
              ? "npm i"
              : "pnpm install",
            { cwd: getBotPath(name) }
          ).then(() => "Done"),
      },
    ]);

    await tasks.run();

    this.log(
      blueBright(
        await new Promise<string>((resolve) =>
          figlet(name, (err, value) => {
            if (err) resolve("");
            else resolve(value as string);
          })
        )
      )
    );

    const runCommand = manager === "npm" ? "npm run" : manager;

    this.log(`

  -> ${colorizeCommand(`cd ./${name}`)} <-

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

   `);

    process.exit(0);
  }
}

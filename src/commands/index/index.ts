import { Command, CliUx, Flags } from "@oclif/core";
import { validateNpm } from "is-valid-package-name";
import { blueBright, grey } from "chalk";
import { Client } from "discord.js";
import { prompt } from "inquirer";
import figlet from "figlet";
import boxen from "boxen";
import Listr from "listr";

import { borderNone, exec, getBotPath, locales } from "../../app/utils";
import { setupDatabase, initialize } from "../../app/actions";
import { databases } from "../../app/database";

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
      boxen(
        blueBright(
          await new Promise<string>((resolve) =>
            figlet("bot.ts", (err, value) => {
              if (err) resolve("");
              else resolve(value as string);
            })
          )
        ),
        {
          float: "center",
          borderStyle: borderNone,
        }
      )
    );

    const { flags } = await this.parse(CreateBot);

    if (
      !(await CliUx.ux.confirm(
        `Do you really want to create your project in this folder?\n${blueBright(
          getBotPath("")
        )}`
      ))
    )
      return process.exit(0);

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

      if (!client.isReady()) {
        return this.error("discord.js is not ready");
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
      ).database as string);

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
        task: () => initialize(name, token, prefix, locale).then(() => "Done"),
      },
      {
        title: "Init database file",
        task: () => setupDatabase(name, databaseName).then(() => "Done"),
      },
      {
        title: "Install dependencies",
        task: () => exec("npm i", { cwd: getBotPath(name) }).then(() => "Done"),
      },
    ]);

    await tasks.run();

    this.log(
      boxen(
        await new Promise<string>((resolve) =>
          figlet(blueBright(name), (err, value) => {
            if (err) resolve("");
            else resolve(value as string);
          })
        )
      ),
      {
        float: "center",
        borderStyle: borderNone,
      }
    );

    const $ = grey("$");

    this.log(
      boxen(
        [
          "",
          grey("# to quickly create a new file"),
          "  " + $ + " yarn create bot.ts command [name]",
          "  " + $ + " make listener [ClientEvent]",
          "  " + $ + " make namespace [name]",
          "  " + $ + " make table [name]",
          "",
          grey("# to watch typescript and reload " + name),
          "  " + $ + " npm run watch",
          "",
          grey("# to build typescript and start " + name),
          "  " + $ + " npm run start",
          "",
          grey("# to simply start " + name),
          "  " + $ + " node .",
          "",
          grey("# format your files with prettier"),
          "  " + $ + " npm run format",
          "",
        ].join("\n"),
        {
          float: "center",
          borderStyle: borderNone,
        }
      )
    );
  }
}

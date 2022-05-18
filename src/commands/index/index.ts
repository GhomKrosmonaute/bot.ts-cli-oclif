import { Command, CliUx, Flags } from "@oclif/core";
import { validateNpm } from "is-valid-package-name";
import { blueBright } from "chalk";
import { Client } from "discord.js";
import { prompt } from "inquirer";
import figlet from "figlet";
import boxen from "boxen";

import { borderNone } from "../../app/utils";
import { databases, setupDatabase } from "../../app/database";

export class CreateBot extends Command {
  static flags = {
    name: Flags.string({ char: "n" }),
    token: Flags.string({ char: "t" }),
    database: Flags.string({ options: databases.map((db) => db.name) }),
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

    // todo: USE https://www.npmjs.com/package/listr FOR LOADING LOGS OF ALL

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

    await setupDatabase(name, databaseName);

    this.log(
      "Given app:\n" +
        JSON.stringify(
          {
            name,
            databaseName,
            token,
          },
          null,
          2
        )
    );
  }
}

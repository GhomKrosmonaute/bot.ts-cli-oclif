import {
  exec,
  getBotPath,
  injectEnvLine,
  readJSON,
  useTemplate,
  writeJSON,
} from "./utils";
import { CliUx } from "@oclif/core";
import { blueBright, green, red } from "chalk";
import databases from "./database";
import { writeFile } from "fs/promises";
import { Client } from "discord.js";

export async function setupDatabase(botName: string, databaseName: string) {
  const pkg = await readJSON(getBotPath("package.json"));
  const database = databases.find((db) => db.name === databaseName);

  if (!database) throw new Error("Oh shit!");

  // delete all other database dependencies.
  for (const db of databases) {
    if (db !== database) delete pkg.dependencies[db.packageName];
    else pkg.dependencies[db.packageName] = "latest";
  }

  await writeJSON(getBotPath("package.json"), pkg);

  await useTemplate(
    databaseName,
    {},
    getBotPath(botName, "src", "app", "database.ts")
  );

  if (Object.keys(database.defaults).length > 0) {
    CliUx.ux.log(`Now we will prepare the database.`);

    for (const name in database.defaults) {
      const def = database.defaults[name];

      const value = await CliUx.ux.prompt(
        `What is the ${blueBright("bot name")} ?`,
        {
          required: !!def,
          default: def ?? undefined,
        }
      );

      await injectEnvLine(`DB_${name.toUpperCase()}`, value);
    }
  }

  CliUx.ux.log(`${green("Successfully")} prepared the database.`);
}

export async function initialize(
  botName: string,
  token: string,
  prefix: string,
  locale: string
) {
  const conf = await readJSON(getBotPath("package.json"));
  await writeJSON(getBotPath("package.json"), {
    ...conf,
    name: botName,
  });

  await writeFile(getBotPath(".env"), "#\n# bot.ts\n#", "utf8");

  const intents =
    "GUILDS,GUILD_MEMBERS,GUILD_BANS,GUILD_EMOJIS_AND_STICKERS,GUILD_INTEGRATIONS,GUILD_WEBHOOKS,GUILD_INVITES,GUILD_VOICE_STATES,GUILD_PRESENCES,GUILD_MESSAGES,GUILD_MESSAGE_REACTIONS,GUILD_MESSAGE_TYPING,DIRECT_MESSAGES,DIRECT_MESSAGE_REACTIONS,DIRECT_MESSAGE_TYPING";

  await injectEnvLine("BOT_INTENTS", intents);
  await injectEnvLine("BOT_PREFIX", prefix);
  await injectEnvLine("BOT_LOCALE", locale);

  const client = new Client<true>({ intents: [] });
  if (token) {
    try {
      await client.login(token);
    } catch (error) {
      throw new Error("Invalid token given.");
    }
    await injectEnvLine("BOT_TOKEN", token);
  }

  if (!client.isReady()) throw new Error("Discord Client connection error");

  await writeFile(
    getBotPath(botName, "readme.md"),
    `# ${
      botName[0].toUpperCase() + botName.slice(1)
    } - powered by [bot.ts](https://github.com/CamilleAbella/bot.ts)`
  );

  await exec("git fetch --unshallow origin", { cwd: getBotPath(botName) });
  await exec("git remote remove origin", { cwd: getBotPath(botName) });
}

// todo: use parts of this snippet to create getOwner util in bot.ts
// if (token && !args.owner) {
//   const app = await client.application.fetch();
//   const ownerID: string =
//     app.owner instanceof discord.User
//       ? app.owner.id
//       : app.owner?.id ?? "none";
//
//   if (ownerID === "none") warns.push("failure to detect bot owner.");
//
//   await injectEnvLine("BOT_OWNER", ownerID, project());
//
//   client.destroy();
// } else if (args.owner) {
//   await injectEnvLine("BOT_OWNER", args.owner, project());
// }

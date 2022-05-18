import {
  getBotPath,
  injectEnvLine,
  readJSON,
  useTemplate,
  writeJSON,
} from "./utils";
import { CliUx } from "@oclif/core";
import { blueBright, green } from "chalk";

export class Database {
  constructor(
    public name: string,
    public packageName: string,
    public defaults: Record<string, string | null>
  ) {}

  toJSON() {
    return {
      name: this.name,
      packageName: this.packageName,
    };
  }
}

const defaults = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: null,
};

export const databases = [
  new Database("sqlite", "vscode/sqlite3", {}),
  new Database("mysql", "mysql2", {
    port: "3306",
    ...defaults,
  }),
  new Database("pgsql", "pg", {
    port: "5432",
    ...defaults,
  }),
];

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

export default databases;

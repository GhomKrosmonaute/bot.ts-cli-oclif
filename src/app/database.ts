import {
  getBotPath,
  injectEnvLine,
  readJSON,
  useTemplate,
  writeJSON,
} from "./utils"
import { CliUx } from "@oclif/core"
import { blueBright, green } from "chalk"

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
    }
  }
}

const defaults = {
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: null,
}

export const databases = [
  new Database("sqlite", "@vscode/sqlite3", {}),
  new Database("mysql", "mysql2", {
    port: "3306",
    ...defaults,
  }),
  new Database("pgsql", "pg", {
    port: "5432",
    ...defaults,
  }),
]

export default databases

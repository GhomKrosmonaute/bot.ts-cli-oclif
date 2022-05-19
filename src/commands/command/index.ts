// make command [name:string] --chain:boolean

import { getBotPath, printTitle, useTemplate } from "../../app/utils";
import { CliUx, Command, Flags } from "@oclif/core";
import { blueBright, green } from "chalk";

export default class CreateCommand extends Command {
  static flags = {
    chain: Flags.boolean({ char: "c" }),
  };

  static args = [{ name: "name" }];

  async run() {
    const { flags, args } = await this.parse(CreateCommand);

    await printTitle("bot.ts");

    const name =
      args.name ??
      (await CliUx.ux.prompt(
        `${green("?")} What is the name of your ${blueBright("new command")}?`,
        { required: true }
      ));

    await useTemplate(
      (flags.chain ? "chain_" : "") + "command",
      {
        name,
        Name: name[0].toUpperCase() + name.slice(1),
      },
      getBotPath("src", "commands", `${name}.ts`)
    );

    CliUx.ux.log(
      `${green("√")} Successfully generated the ${blueBright(name)} command.`
    );
  }
}

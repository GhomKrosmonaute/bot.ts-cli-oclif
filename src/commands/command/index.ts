// todo: implement command "make command [name]"

import { Command } from "@oclif/core";

export default class CreateCommand extends Command {
  static flags = {};

  static args = [
    {
      name: "name",
    },
  ];

  async run() {}
}

import { join } from "path";
import { writeFile, readFile } from "fs/promises";
import { grey } from "chalk";
import { CliUx } from "@oclif/core";

export function getBotPath(botName: string, ...segment: string[]) {
  return join(process.cwd(), botName, ...segment);
}

export function getCliPath(...segments: string[]) {
  return join(__dirname, "..", "..", ...segments);
}

export async function readJSON(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJSON(path: string, json: object) {
  await writeFile(path, JSON.stringify(json, null, 2), "utf8");
}

export async function useTemplate(
  templateName: string,
  replacers: Record<string, string>,
  path: string
) {
  let template = await readFile(getCliPath("templates", templateName), "utf-8");

  for (const pattern in replacers) {
    const replacer = replacers[pattern];

    template = template.replace(new RegExp(`{{ ${pattern} }}`, "g"), replacer);
  }

  await writeFile(path, template);
}

export async function injectEnvLine(name: string, value: string) {
  const env = await readFile(getBotPath(".env"), "utf8");
  const lines = env.split("\n");
  const index = lines.findIndex((line) => line.split("=")[0] === name);

  if (index > -1) lines.splice(index, 1);

  lines.push(`${name}="${value}"`);

  await writeFile(getBotPath(".env"), lines.join("\n"), "utf8");
}

export async function loader(message: string, callback: () => unknown) {
  const time = Date.now();

  CliUx.ux.action.start(message);

  await callback();

  CliUx.ux.action.stop(`done. ${grey(`${Date.now() - time}ms`)}`);
}

export const borderNone = {
  top: " ",
  left: " ",
  right: " ",
  bottom: " ",
  topLeft: " ",
  topRight: " ",
  bottomLeft: " ",
  bottomRight: " ",
  horizontal: " ",
  vertical: " ",
};

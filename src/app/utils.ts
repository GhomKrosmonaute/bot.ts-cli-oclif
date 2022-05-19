import cp from "child_process";
import { join } from "path";
import { CliUx } from "@oclif/core";
import { writeFile, readFile } from "fs/promises";
import { grey, redBright, green } from "chalk";

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

export function colorizeCommand(command: string): string {
  return `${grey("$")} ${command
    .split(/\s+/)
    .map((part, i) => {
      return i === 0
        ? redBright(part)
        : part.includes("[")
        ? grey(part)
        : part.includes('"') || part.includes(".")
        ? green(part)
        : part;
    })
    .join(" ")}`;
}

export async function injectEnvLine(
  botName: string,
  name: string,
  value: string
) {
  const env = await readFile(getBotPath(botName, ".env"), "utf8");
  const lines = env.split("\n");
  const index = lines.findIndex((line) => line.split("=")[0] === name);

  if (index > -1) lines.splice(index, 1);

  lines.push(`${name}="${value}"`);

  await writeFile(getBotPath(botName, ".env"), lines.join("\n"), "utf8");
}

export async function loader(message: string, callback: () => unknown) {
  const time = Date.now();

  CliUx.ux.action.start(message);

  await callback();

  CliUx.ux.action.stop(`done. ${grey(`${Date.now() - time}ms`)}`);
}

export async function exec(
  cmd: string,
  options?: cp.CommonOptions
): Promise<null> {
  return new Promise((res, rej) => {
    cp.exec(cmd, options, (err) => {
      if (err) rej(err);
      else res(null);
    });
  });
}

export const locales = ["en", "fr", "es", "de", "ja"];

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

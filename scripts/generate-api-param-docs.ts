import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { API_PARAM_DEFS } from "../lib/api-params";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function buildEnglishTable(): string {
  const header = "| Name | Short | Group | Description |\n" +
    "| ---- | ----- | ----- | ----------- |";

  const rows = API_PARAM_DEFS.map((def) => {
    const short = def.shortKey ?? "-";
    const group = def.group;
    const desc = def.description;
    return `| \`${def.name}\` | \`${short}\` | ${group} | ${desc} |`;
  });

  return [header, ...rows].join("\n");
}

function buildChineseTable(): string {
  const header = "| 参数名 | 短 key | 分组 | 描述 |\n" +
    "| ------ | ------ | ---- | ---- |";

  const rows = API_PARAM_DEFS.map((def) => {
    const longName = def.zhName ?? def.name;
    const short = def.shortKey ?? "-";
    const group = def.zhGroup ?? def.group;
    const desc = def.zhDescription ?? def.description;
    return `| \`${longName}\` | \`${short}\` | ${group} | ${desc} |`;
  });

  return [header, ...rows].join("\n");
}

function normalizeTableContent(table: string): string {
  const lines = table.split(/\r?\n/);
  const rows: string[][] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").slice(1, -1).map((c) => c.trim());

    const isSeparatorRow = cells.every((c) => /^:?-{3,}:?$/.test(c));
    if (isSeparatorRow) continue;

    const normalizedCells = cells.map((cell) => {
      let v = cell.trim();
      if (v.startsWith("`") && v.endsWith("`")) {
        v = v.slice(1, -1);
      }
      v = v.replace(/\s+/g, " ").trim();
      return v;
    });

    if (normalizedCells.length > 0) {
      rows.push(normalizedCells);
    }
  }

  return JSON.stringify(rows);
}

async function replaceSection(
  filePath: string,
  startMarker: string,
  endMarker: string,
  replacement: string,
): Promise<void> {
  const raw = await fs.readFile(filePath, "utf8");
  const start = raw.indexOf(startMarker);
  const end = raw.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Markers not found in ${path.basename(filePath)}. ` +
        `Expected markers: ${startMarker} ... ${endMarker}`,
    );
  }

  const before = raw.slice(0, start + startMarker.length);
  const between = raw.slice(start + startMarker.length, end);
  const after = raw.slice(end);

  const existingNormalized = normalizeTableContent(between);
  const nextNormalized = normalizeTableContent(replacement);

  if (existingNormalized === nextNormalized) {
    return;
  }

  const next = `${before}\n\n${replacement}\n${after}`;
  await fs.writeFile(filePath, next, "utf8");
}

async function main() {
  const enTable = buildEnglishTable();
  const zhTable = buildChineseTable();

  const readmeEn = path.join(ROOT, "README.md");
  const readmeZh = path.join(ROOT, "README.ZH.md");

  await replaceSection(
    readmeEn,
    "<!-- API_PARAM_MAPPING:START -->",
    "<!-- API_PARAM_MAPPING:END -->",
    enTable,
  );

  await replaceSection(
    readmeZh,
    "<!-- API_PARAM_MAPPING_ZH:START -->",
    "<!-- API_PARAM_MAPPING_ZH:END -->",
    zhTable,
  );

  console.log(
    "API param mapping tables updated in README.md and README.ZH.md",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

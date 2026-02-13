import type { Table, Column } from "./types";

const SQL_TO_TS: Record<string, string> = {
  int: "number",
  integer: "number",
  smallint: "number",
  bigint: "number",
  tinyint: "number",
  mediumint: "number",
  float: "number",
  double: "number",
  decimal: "number",
  numeric: "number",
  real: "number",
  serial: "number",
  bigserial: "number",
  smallserial: "number",

  varchar: "string",
  char: "string",
  text: "string",
  mediumtext: "string",
  longtext: "string",
  tinytext: "string",
  uuid: "string",
  citext: "string",
  name: "string",

  boolean: "boolean",
  bool: "boolean",

  date: "string",
  datetime: "string",
  timestamp: "string",
  timestamptz: "string",
  time: "string",
  timetz: "string",
  interval: "string",

  json: "any",
  jsonb: "any",

  bytea: "Uint8Array",
  blob: "Uint8Array",

  enum: "string",
};

function sqlTypeToTs(sqlType: string): string {
  const base = sqlType.toLowerCase().replace(/\(.*\)/, "").trim();
  return SQL_TO_TS[base] || "any";
}

function toPascalCase(name: string): string {
  return name
    .split(/[_\s-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

export function generateInterface(table: Table): string {
  const name = toPascalCase(table.name);
  const lines = table.columns.map((col) => {
    const tsType = sqlTypeToTs(col.type);
    const optional = col.nullable ? "?" : "";
    return `  ${col.name}${optional}: ${tsType};`;
  });
  return `export interface ${name} {\n${lines.join("\n")}\n}`;
}

export function generateAllInterfaces(tables: Table[]): string {
  return tables.map(generateInterface).join("\n\n");
}

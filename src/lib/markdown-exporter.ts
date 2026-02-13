import type { ParseResult } from "./types";

export function generateMarkdown(result: ParseResult): string {
  const lines: string[] = [];
  lines.push("# Database Schema Documentation\n");

  for (const table of result.tables) {
    lines.push(`## ${table.name}\n`);
    lines.push("| Column | Type | Nullable | Default | Constraints |");
    lines.push("|--------|------|----------|---------|-------------|");
    for (const col of table.columns) {
      const constraints = [
        ...(col.isPrimaryKey ? ["PK"] : []),
        ...(col.isForeignKey ? [`FK → ${col.references?.table}.${col.references?.column}`] : []),
        ...col.constraints.filter((c) => c !== "PRIMARY KEY"),
      ].join(", ");
      lines.push(
        `| ${col.name} | ${col.type} | ${col.nullable ? "Yes" : "No"} | ${col.defaultValue ?? "-"} | ${constraints || "-"} |`
      );
    }
    lines.push("");
  }

  if (result.relationships.length > 0) {
    lines.push("## Relationships\n");
    for (const rel of result.relationships) {
      lines.push(
        `- **${rel.fromTable}.${rel.fromColumn}** → **${rel.toTable}.${rel.toColumn}**${rel.onDelete ? ` (ON DELETE ${rel.onDelete})` : ""}`
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

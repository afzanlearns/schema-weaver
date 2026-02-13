import type { ParseResult, Table, Column, Relationship } from "./types";

export function parseSQL(sql: string): ParseResult {
  const tables: Table[] = [];
  const relationships: Relationship[] = [];
  const errors: string[] = [];

  // Normalize line endings and remove comments
  const cleaned = sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\r\n/g, "\n");

  // Match CREATE TABLE statements
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"']?(\w+)[`"']?(?:\s*\.\s*[`"']?(\w+)[`"']?)?\s*\(([\s\S]*?)\)\s*(?:ENGINE\s*=\s*\w+)?(?:\s*DEFAULT\s+CHARSET\s*=\s*\w+)?(?:\s*COLLATE\s*=\s*\w+)?(?:\s*AUTO_INCREMENT\s*=\s*\d+)?\s*;/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(cleaned)) !== null) {
    try {
      const tableName = match[2] || match[1]; // handle schema.table
      const body = match[3];
      const { columns, tableRelationships, tableErrors } = parseTableBody(tableName, body);
      tables.push({ name: tableName, columns });
      relationships.push(...tableRelationships);
      errors.push(...tableErrors);
    } catch (e) {
      errors.push(`Error parsing table: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (tables.length === 0) {
    errors.push("No CREATE TABLE statements found. Make sure your SQL uses standard CREATE TABLE syntax.");
  }

  return { tables, relationships, errors };
}

function parseTableBody(
  tableName: string,
  body: string
): {
  columns: Column[];
  tableRelationships: Relationship[];
  tableErrors: string[];
} {
  const columns: Column[] = [];
  const tableRelationships: Relationship[] = [];
  const tableErrors: string[] = [];

  // Split by commas, but respect parentheses nesting
  const parts = splitByComma(body);

  const primaryKeyColumns: string[] = [];
  const foreignKeyDefs: { col: string; refTable: string; refCol: string; onDelete?: string; onUpdate?: string }[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Table-level PRIMARY KEY
    const pkMatch = trimmed.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
    if (pkMatch) {
      const cols = pkMatch[1].split(",").map((c) => c.trim().replace(/[`"']/g, ""));
      primaryKeyColumns.push(...cols);
      continue;
    }

    // Table-level FOREIGN KEY
    const fkMatch = trimmed.match(
      /^(?:CONSTRAINT\s+[`"']?\w+[`"']?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"']?(\w+)[`"']?(?:\s*\.\s*[`"']?(\w+)[`"']?)?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i
    );
    if (fkMatch) {
      const col = fkMatch[1].trim().replace(/[`"']/g, "");
      const refTable = fkMatch[3] || fkMatch[2];
      const refCol = fkMatch[4].trim().replace(/[`"']/g, "");
      foreignKeyDefs.push({
        col,
        refTable: refTable.replace(/[`"']/g, ""),
        refCol,
        onDelete: fkMatch[5],
        onUpdate: fkMatch[6],
      });
      continue;
    }

    // UNIQUE, INDEX, KEY, CHECK constraints at table level
    if (/^(?:UNIQUE|INDEX|KEY|CHECK)\s/i.test(trimmed)) {
      continue;
    }

    // Column definition
    const colMatch = trimmed.match(
      /^[`"']?(\w+)[`"']?\s+(\w+(?:\s*\([^)]*\))?(?:\s+(?:UNSIGNED|VARYING|WITHOUT\s+TIME\s+ZONE|WITH\s+TIME\s+ZONE|CHARACTER\s+SET\s+\w+))*)(.*)/i
    );
    if (colMatch) {
      const colName = colMatch[1];
      const colType = colMatch[2].trim();
      const rest = colMatch[3] || "";

      const nullable = !/NOT\s+NULL/i.test(rest);
      const isPK = /PRIMARY\s+KEY/i.test(rest);
      const constraints: string[] = [];

      if (isPK) {
        primaryKeyColumns.push(colName);
        constraints.push("PRIMARY KEY");
      }
      if (/UNIQUE/i.test(rest)) constraints.push("UNIQUE");
      if (/AUTO_INCREMENT|SERIAL/i.test(rest) || /SERIAL/i.test(colType)) constraints.push("AUTO_INCREMENT");
      if (/NOT\s+NULL/i.test(rest)) constraints.push("NOT NULL");

      let defaultValue: string | null = null;
      const defaultMatch = rest.match(/DEFAULT\s+('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\S+)/i);
      if (defaultMatch) {
        defaultValue = defaultMatch[1].replace(/^['"]|['"]$/g, "");
      }

      // Inline REFERENCES
      const inlineRefMatch = rest.match(
        /REFERENCES\s+[`"']?(\w+)[`"']?\s*\(([^)]+)\)(?:\s+ON\s+DELETE\s+(\w+(?:\s+\w+)?))?(?:\s+ON\s+UPDATE\s+(\w+(?:\s+\w+)?))?/i
      );
      let references: Column["references"] = undefined;
      if (inlineRefMatch) {
        references = {
          table: inlineRefMatch[1].replace(/[`"']/g, ""),
          column: inlineRefMatch[2].trim().replace(/[`"']/g, ""),
        };
        foreignKeyDefs.push({
          col: colName,
          refTable: references.table,
          refCol: references.column,
          onDelete: inlineRefMatch[3],
          onUpdate: inlineRefMatch[4],
        });
      }

      columns.push({
        name: colName,
        type: colType,
        nullable,
        defaultValue,
        isPrimaryKey: isPK,
        isForeignKey: !!references,
        references,
        constraints,
      });
    }
  }

  // Apply table-level PK
  for (const col of columns) {
    if (primaryKeyColumns.includes(col.name)) {
      col.isPrimaryKey = true;
      if (!col.constraints.includes("PRIMARY KEY")) {
        col.constraints.push("PRIMARY KEY");
      }
    }
  }

  // Apply table-level FK
  for (const fk of foreignKeyDefs) {
    const col = columns.find((c) => c.name === fk.col);
    if (col) {
      col.isForeignKey = true;
      col.references = { table: fk.refTable, column: fk.refCol };
    }
    tableRelationships.push({
      fromTable: tableName,
      fromColumn: fk.col,
      toTable: fk.refTable,
      toColumn: fk.refCol,
      onDelete: fk.onDelete,
      onUpdate: fk.onUpdate,
    });
  }

  return { columns, tableRelationships, tableErrors };
}

function splitByComma(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of body) {
    if (char === "(") {
      depth++;
      current += char;
    } else if (char === ")") {
      depth--;
      current += char;
    } else if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current);

  return parts;
}

import React, { useMemo } from "react";
import type { Table, Relationship } from "@/lib/types";
import { generateInterface } from "@/lib/ts-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, X, ArrowUpRight, ArrowDownLeft, Key, Columns3, Tag } from "lucide-react";
import { toast } from "sonner";

interface TableDetailPanelProps {
  table: Table;
  allTables: Table[];
  relationships: Relationship[];
  onClose: () => void;
}

type TableRole = "Central Entity" | "Junction Table" | "Leaf Table" | "Root Table" | null;

function classifyTableRole(
  tableName: string,
  table: Table,
  incoming: Relationship[],
  outgoing: Relationship[]
): TableRole {
  const outgoingCount = outgoing.length;
  const incomingCount = incoming.length;

  // Junction Table: exactly 2 outgoing FKs and very few non-FK columns
  const fkCols = table.columns.filter((c) => c.isForeignKey).length;
  const nonFkCols = table.columns.length - fkCols;
  if (outgoingCount === 2 && nonFkCols <= 2) return "Junction Table";

  // Central Entity: referenced by 3+ tables
  if (incomingCount >= 3) return "Central Entity";

  // Root Table: has incoming refs but no outgoing
  if (incomingCount > 0 && outgoingCount === 0) return "Root Table";

  // Leaf Table: no incoming references
  if (incomingCount === 0 && outgoingCount > 0) return "Leaf Table";

  return null;
}

const ROLE_STYLES: Record<string, string> = {
  "Central Entity": "bg-chart-1/15 text-chart-1 border-chart-1/30",
  "Junction Table": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  "Leaf Table": "bg-chart-4/15 text-chart-4 border-chart-4/30",
  "Root Table": "bg-chart-5/15 text-chart-5 border-chart-5/30",
};

const TableDetailPanel: React.FC<TableDetailPanelProps> = ({
  table,
  allTables,
  relationships,
  onClose,
}) => {
  const tsCode = generateInterface(table);

  const copyTs = () => {
    navigator.clipboard.writeText(tsCode);
    toast.success("TypeScript interface copied!");
  };

  const { pk, outgoing, incoming, role } = useMemo(() => {
    const pkCol = table.columns.find((c) => c.isPrimaryKey);
    const out = relationships.filter((r) => r.fromTable === table.name);
    const inc = relationships.filter((r) => r.toTable === table.name);
    const role = classifyTableRole(table.name, table, inc, out);
    return { pk: pkCol, outgoing: out, incoming: inc, role };
  }, [table, relationships]);

  return (
    <div className="w-72 border-l border-border bg-card h-full overflow-y-auto absolute right-0 top-0 z-10 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">{table.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* ── Table Summary ── */}
      <div className="px-4 py-3 border-b border-border">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Key className="h-3 w-3" />
            <span>Primary Key</span>
          </div>
          <span className="font-medium text-foreground font-mono text-right">
            {pk ? pk.name : "—"}
          </span>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Columns3 className="h-3 w-3" />
            <span>Columns</span>
          </div>
          <span className="font-medium text-foreground text-right">
            {table.columns.length}
          </span>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowDownLeft className="h-3 w-3" />
            <span>Incoming</span>
          </div>
          <span className="font-medium text-foreground text-right">
            {incoming.length}
          </span>

          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ArrowUpRight className="h-3 w-3" />
            <span>Outgoing</span>
          </div>
          <span className="font-medium text-foreground text-right">
            {outgoing.length}
          </span>
        </div>

        {role && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${ROLE_STYLES[role] || ""}`}
            >
              {role}
            </span>
          </div>
        )}
      </div>

      {/* ── Relationship Summary ── */}
      {(outgoing.length > 0 || incoming.length > 0) && (
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-xs font-medium text-foreground mb-2">Relationships</h4>

          {outgoing.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Outgoing
              </p>
              <div className="space-y-0.5">
                {outgoing.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-xs font-mono text-muted-foreground"
                  >
                    <ArrowUpRight className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-foreground">{r.fromColumn}</span>
                    <span className="text-muted-foreground/60">→</span>
                    <span>{r.toTable}.{r.toColumn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {incoming.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Incoming
              </p>
              <div className="space-y-0.5">
                {incoming.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 text-xs font-mono text-muted-foreground"
                  >
                    <ArrowDownLeft className="h-3 w-3 text-primary shrink-0" />
                    <span>{r.fromTable}.{r.fromColumn}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Column Metadata ── */}
      <div className="px-4 py-3">
        <h4 className="text-sm font-medium text-foreground mb-2">Columns</h4>
        <div className="space-y-2">
          {table.columns.map((col) => (
            <div key={col.name} className="border border-border rounded p-2 text-xs">
              <div className="flex items-center gap-1 mb-1">
                <span className="font-medium text-foreground">{col.name}</span>
                {col.isPrimaryKey && (
                  <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-chart-5 text-primary-foreground">PK</Badge>
                )}
                {col.isForeignKey && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">FK</Badge>
                )}
              </div>
              <div className="text-muted-foreground">
                <span>Type: {col.type}</span>
                <span className="mx-1">·</span>
                <span>{col.nullable ? "Nullable" : "Not Null"}</span>
                {col.defaultValue && (
                  <>
                    <span className="mx-1">·</span>
                    <span>Default: {col.defaultValue}</span>
                  </>
                )}
              </div>
              {col.references && (
                <div className="text-muted-foreground mt-1">
                  → {col.references.table}.{col.references.column}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── TypeScript Interface ── */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-foreground">TypeScript Interface</h4>
          <Button variant="ghost" size="sm" onClick={copyTs}>
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
        </div>
        <pre className="bg-background border border-border rounded p-3 text-xs font-mono overflow-x-auto whitespace-pre text-foreground">
          {tsCode}
        </pre>
      </div>
    </div>
  );
};

export default TableDetailPanel;

import React from "react";
import type { Table } from "@/lib/types";
import { generateInterface } from "@/lib/ts-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, X } from "lucide-react";
import { toast } from "sonner";

interface TableDetailPanelProps {
  table: Table;
  onClose: () => void;
}

const TableDetailPanel: React.FC<TableDetailPanelProps> = ({ table, onClose }) => {
  const tsCode = generateInterface(table);

  const copyTs = () => {
    navigator.clipboard.writeText(tsCode);
    toast.success("TypeScript interface copied!");
  };

  return (
    <div className="w-80 border-l border-border bg-card h-full overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">{table.name}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

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

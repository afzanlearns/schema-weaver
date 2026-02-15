import React, { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/lib/types";

export interface TableNodeData {
  label: string;
  columns: Column[];
  [key: string]: unknown;
}

const TableNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TableNodeData;
  return (
    <div
      className={`bg-card border rounded-lg min-w-[220px] overflow-hidden transition-all duration-200 ${selected
        ? "border-primary ring-2 ring-primary/30 shadow-lg"
        : "border-border shadow-md hover:shadow-lg hover:border-primary/40"
        }`}
      style={{
        boxShadow: selected
          ? "0 0 20px rgba(96,165,250,0.35), 0 8px 24px rgba(0,0,0,0.35)"
          : "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* Header — #1F2937 in dark */}
      <div className="bg-secondary text-secondary-foreground px-3 py-2 font-semibold text-sm">
        {nodeData.label}
      </div>
      <div className="px-1 py-1">
        {nodeData.columns.map((col: Column) => (
          <div
            key={col.name}
            className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-accent/50 rounded transition-colors"
          >
            {/* Column name — #E5E7EB */}
            <span className="text-foreground font-medium flex-1 truncate">{col.name}</span>
            {/* Column type — #94A3B8 */}
            <span className="text-muted-foreground truncate max-w-[80px]">{col.type}</span>
            {col.isPrimaryKey && (
              <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-primary text-primary-foreground font-bold">
                PK
              </Badge>
            )}
            {col.isForeignKey && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1 py-0 h-4 dark:bg-[#1E40AF] dark:text-[#DBEAFE]"
              >
                FK
              </Badge>
            )}
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
    </div>
  );
});

TableNode.displayName = "TableNode";

export default TableNode;

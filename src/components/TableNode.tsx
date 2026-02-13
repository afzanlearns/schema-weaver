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
      className={`bg-card border rounded-lg shadow-sm min-w-[220px] overflow-hidden ${
        selected ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      <div className="bg-primary text-primary-foreground px-3 py-2 font-semibold text-sm">
        {nodeData.label}
      </div>
      <div className="px-1 py-1">
        {nodeData.columns.map((col: Column, i: number) => (
          <div
            key={col.name}
            className="flex items-center gap-2 px-2 py-1 text-xs hover:bg-accent/50 rounded"
          >
            <span className="text-foreground font-medium flex-1 truncate">{col.name}</span>
            <span className="text-muted-foreground truncate max-w-[80px]">{col.type}</span>
            {col.isPrimaryKey && (
              <Badge variant="default" className="text-[10px] px-1 py-0 h-4 bg-chart-5 text-primary-foreground">
                PK
              </Badge>
            )}
            {col.isForeignKey && (
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
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

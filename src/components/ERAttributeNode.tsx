import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ERAttributeData {
  label: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  [key: string]: unknown;
}

const ERAttributeNode = ({ data }: NodeProps) => {
  const { label, isPrimaryKey, isForeignKey } = data as ERAttributeData;
  return (
    <div
      className={`px-4 py-1.5 bg-card text-muted-foreground text-[11px] text-center min-w-[80px] transition-all duration-200 ${isForeignKey ? "border-dashed border" : "border"
        } border-border/70 hover:border-border`}
      style={{ borderRadius: "50%" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted !w-1.5 !h-1.5" />
      <span className={isPrimaryKey ? "underline font-semibold text-foreground" : "font-normal"}>{label}</span>
    </div>
  );
};

export default ERAttributeNode;

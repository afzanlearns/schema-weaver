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
      className={`px-4 py-1.5 bg-card text-foreground text-sm text-center min-w-[80px] ${
        isForeignKey ? "border-dashed border" : "border"
      } border-border`}
      style={{ borderRadius: "50%" }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted !w-1.5 !h-1.5" />
      <span className={isPrimaryKey ? "underline font-semibold" : ""}>{label}</span>
    </div>
  );
};

export default ERAttributeNode;

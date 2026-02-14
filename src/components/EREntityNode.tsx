import { Handle, Position, type NodeProps } from "@xyflow/react";

interface EREntityData {
  label: string;
  [key: string]: unknown;
}

const EREntityNode = ({ data }: NodeProps) => {
  const { label } = data as EREntityData;
  return (
    <div className="px-6 py-3 bg-card border-2 border-primary font-bold text-foreground text-center min-w-[120px] shadow-sm">
      <Handle type="target" position={Position.Top} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Left} id="left" className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-primary !w-2 !h-2" />
      {label}
    </div>
  );
};

export default EREntityNode;

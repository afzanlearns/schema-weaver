import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ERRelationshipData {
  label: string;
  [key: string]: unknown;
}

const ERRelationshipNode = ({ data }: NodeProps) => {
  const { label } = data as ERRelationshipData;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <div
        className="absolute inset-0 bg-card border-2 border-primary/60 shadow-lg transition-all duration-200 hover:border-primary hover:shadow-xl"
        style={{ transform: "rotate(45deg)", width: "70px", height: "70px", margin: "auto", top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <span className="relative z-10 text-xs font-semibold text-foreground text-center leading-tight max-w-[60px]">
        {label}
      </span>
      <Handle type="target" position={Position.Left} className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
      <Handle type="target" position={Position.Top} id="top" className="!bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-primary !w-2 !h-2" />
    </div>
  );
};

export default ERRelationshipNode;

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
      className={`px-4 py-1.5 text-[11px] text-center min-w-[80px] transition-all duration-200 ${isForeignKey ? "border-dashed border" : "border"
        }`}
      data-pk={isPrimaryKey}
      style={{
        borderRadius: "50%",
        backgroundColor: "var(--attr-bg, hsl(var(--card)))",
        borderColor: "rgba(148,163,184,0.35)",
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted !w-1.5 !h-1.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-muted !w-1.5 !h-1.5" />
      {/* Label — #E5E7EB for text, PK gets stronger emphasis */}
      <span
        className={
          isPrimaryKey
            ? "underline font-semibold text-foreground"
            : "font-normal text-muted-foreground"
        }
      >
        {label}
      </span>
    </div>
  );
};

export default ERAttributeNode;

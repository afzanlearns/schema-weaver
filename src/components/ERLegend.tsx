import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

export type LegendType = "entity" | "relationship" | "attribute" | "pk" | "cardinality-1" | "cardinality-n" | null;

interface ERLegendProps {
    onHover: (type: LegendType) => void;
}

const LegendItem = ({
    icon,
    label,
    description,
    type,
    onHover,
}: {
    icon: React.ReactNode;
    label: string;
    description: string;
    type: LegendType;
    onHover: (type: LegendType) => void;
}) => (
    <div
        className="flex items-start gap-3 p-2 rounded-md hover:rounded-xl hover:bg-muted/30 transition-all duration-300 cursor-help group"
        onMouseEnter={() => onHover(type)}
        onMouseLeave={() => onHover(null)}
    >
        <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
            {icon}
        </div>
        <div>
            <div className="text-xs font-medium text-foreground">{label}</div>
            <div className="text-[10px] text-muted-foreground leading-tight">{description}</div>
        </div>
    </div>
);

export const ERLegend = ({ onHover }: ERLegendProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end pointer-events-none">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-card border border-border shadow-md rounded-full text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all mb-2"
            >
                <Info className="w-3.5 h-3.5" />
                Legend
                {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {isOpen && (
                <div
                    className="pointer-events-auto w-72 bg-card border border-border/50 shadow-xl rounded-lg overflow-hidden backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200"
                >
                    <div className="px-3 py-2 bg-muted/20 border-b border-border/50 text-xs font-semibold text-foreground">
                        ER Notation Guide
                    </div>
                    <div className="p-2 space-y-0.5 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                        <LegendItem
                            type="entity"
                            onHover={onHover}
                            icon={<div className="w-4 h-3 border-2 border-primary rounded-[2px]" />}
                            label="Entity"
                            description="Represents a database table or object."
                        />
                        <LegendItem
                            type="relationship"
                            onHover={onHover}
                            icon={
                                <div className="w-4 h-4 flex items-center justify-center">
                                    <div className="w-3 h-3 border border-foreground/50 rotate-45 bg-muted/20" />
                                </div>
                            }
                            label="Relationship"
                            description="Logically connects two entities."
                        />
                        <LegendItem
                            type="attribute"
                            onHover={onHover}
                            icon={<div className="w-4 h-3 border border-foreground/50 rounded-full" />}
                            label="Attribute"
                            description="A property of an entity."
                        />
                        <LegendItem
                            type="pk"
                            onHover={onHover}
                            icon={
                                <div className="w-4 h-3 border border-foreground/50 rounded-full flex items-center justify-center">
                                    <div className="w-full h-px bg-foreground/50" />
                                </div>
                            }
                            label="Primary Key"
                            description="Uniquely identifies each record."
                        />
                        <div className="h-px bg-border/50 my-2 mx-2" />
                        <LegendItem
                            type="cardinality-1"
                            onHover={onHover}
                            icon={<div className="font-mono text-[10px] font-bold">1</div>}
                            label="One Cardinality"
                            description="Exactly one instance participates."
                        />
                        <LegendItem
                            type="cardinality-n"
                            onHover={onHover}
                            icon={<div className="font-mono text-[10px] font-bold">N</div>}
                            label="Many Cardinality"
                            description="Multiple instances can participate."
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

import type { Table, Relationship } from "./types";
import type { Node, Edge } from "@xyflow/react";

export function generateERNodesAndEdges(
  tables: Table[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const cols = Math.ceil(Math.sqrt(tables.length));
  const spacingX = 700;
  const spacingY = 600;

  const entityPositions: Record<string, { x: number; y: number }> = {};

  // Place entity nodes in grid
  tables.forEach((table, i) => {
    const x = (i % cols) * spacingX;
    const y = Math.floor(i / cols) * spacingY;
    entityPositions[table.name] = { x, y };

    nodes.push({
      id: `entity-${table.name}`,
      type: "erEntity",
      position: { x, y },
      data: { label: table.name },
    });

    // Fan attributes around entity
    const attrCount = table.columns.length;
    const arcStart = -Math.PI * 0.8;
    const arcEnd = Math.PI * 0.8;
    const radius = 180 + Math.max(0, (attrCount - 6) * 15);

    table.columns.forEach((col, ci) => {
      const angle = attrCount === 1
        ? -Math.PI / 2
        : arcStart + (ci / (attrCount - 1)) * (arcEnd - arcStart);
      const ax = x + Math.cos(angle) * radius;
      const ay = y + Math.sin(angle) * radius - 80;

      const attrId = `attr-${table.name}-${col.name}`;
      nodes.push({
        id: attrId,
        type: "erAttribute",
        position: { x: ax, y: ay },
        data: {
          label: col.name,
          isPrimaryKey: col.isPrimaryKey,
          isForeignKey: col.isForeignKey,
        },
      });

      edges.push({
        id: `edge-attr-${table.name}-${col.name}`,
        source: `entity-${table.name}`,
        target: attrId,
        style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 },
        type: "straight",
      });
    });
  });

  // Place relationship diamonds
  relationships.forEach((rel, i) => {
    const fromPos = entityPositions[rel.fromTable];
    const toPos = entityPositions[rel.toTable];
    if (!fromPos || !toPos) return;

    const relId = `rel-${i}`;
    const mx = (fromPos.x + toPos.x) / 2;
    const my = (fromPos.y + toPos.y) / 2;

    // Derive label from column name
    const label = rel.fromColumn.replace(/_id$/i, "").replace(/_/g, " ").toUpperCase();

    nodes.push({
      id: relId,
      type: "erRelationship",
      position: { x: mx - 50, y: my - 50 },
      data: { label: label || "FK" },
    });

    // Determine cardinality
    const fromIsUnique = false; // Default: N side
    const fromLabel = fromIsUnique ? "1" : "N";
    const toLabel = "1";

    edges.push({
      id: `edge-rel-from-${i}`,
      source: `entity-${rel.fromTable}`,
      target: relId,
      label: fromLabel,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" },
    });

    edges.push({
      id: `edge-rel-to-${i}`,
      source: relId,
      target: `entity-${rel.toTable}`,
      label: toLabel,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: { fontSize: 12, fontWeight: 700, fill: "hsl(var(--foreground))" },
    });
  });

  return { nodes, edges };
}

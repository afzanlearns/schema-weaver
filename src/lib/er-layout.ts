import type { Table, Relationship } from "./types";
import type { Node, Edge } from "@xyflow/react";

/* ── Layout Constants ── */
const GRID_SPACING_X = 700;
const GRID_SPACING_Y = 650;
const ATTR_ARC_START = -Math.PI * 0.8;
const ATTR_ARC_END = Math.PI * 0.8;
const ATTR_BASE_RADIUS = 200;
const ATTR_GROWTH_PER_COL = 18;
const DIAMOND_SIZE = 100; // matches ERRelationshipNode width/height
const DIAMOND_HALF = DIAMOND_SIZE / 2;
const DIAMOND_PERP_OFFSET = 80; // pixels off-axis to avoid the straight line
const MIN_SEPARATION = 120; // minimum distance between any two nodes

/* ── Helpers ── */
interface Rect {
  cx: number;
  cy: number;
  hw: number; // half-width
  hh: number; // half-height
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    Math.abs(a.cx - b.cx) < a.hw + b.hw &&
    Math.abs(a.cy - b.cy) < a.hh + b.hh
  );
}

function nudgeAwayFromAll(
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  occupied: Rect[]
): { x: number; y: number } {
  const candidate: Rect = { cx, cy, hw, hh };
  let attempts = 0;
  const step = 60;

  // Try perpendicular offsets in expanding spirals
  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -1, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: 1 },
  ];

  while (attempts < 24) {
    const collides = occupied.some((o) => rectsOverlap(candidate, o));
    if (!collides) break;
    const dir = directions[attempts % directions.length];
    const mag = Math.floor(attempts / directions.length + 1) * step;
    candidate.cx = cx + dir.dx * mag;
    candidate.cy = cy + dir.dy * mag;
    attempts++;
  }

  return { x: candidate.cx - hw, y: candidate.cy - hh };
}

/* ── Main Generator ── */
export function generateERNodesAndEdges(
  tables: Table[],
  relationships: Relationship[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const occupied: Rect[] = []; // collision tracking

  const cols = Math.ceil(Math.sqrt(tables.length));
  const entityPositions: Record<string, { x: number; y: number }> = {};

  // ── 1. Place entity nodes in grid ──
  tables.forEach((table, i) => {
    const x = (i % cols) * GRID_SPACING_X;
    const y = Math.floor(i / cols) * GRID_SPACING_Y;
    entityPositions[table.name] = { x, y };

    nodes.push({
      id: `entity-${table.name}`,
      type: "erEntity",
      position: { x, y },
      data: { label: table.name },
    });

    // Entity approximate size: ~140w × 40h (measured from EREntityNode)
    occupied.push({ cx: x + 70, cy: y + 20, hw: 80, hh: 30 });

    // ── 2. Fan attributes around entity ──
    const attrCount = table.columns.length;
    const radius = ATTR_BASE_RADIUS + Math.max(0, (attrCount - 6) * ATTR_GROWTH_PER_COL);

    table.columns.forEach((col, ci) => {
      const angle =
        attrCount === 1
          ? -Math.PI / 2
          : ATTR_ARC_START + (ci / (attrCount - 1)) * (ATTR_ARC_END - ATTR_ARC_START);
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

      // Attribute approximate size: ~100w × 30h (ellipse)
      occupied.push({ cx: ax + 50, cy: ay + 15, hw: 55, hh: 20 });

      edges.push({
        id: `edge-attr-${table.name}-${col.name}`,
        source: `entity-${table.name}`,
        target: attrId,
        style: { stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 },
        type: "straight",
      });
    });
  });

  // ── 3. Place relationship diamonds with collision avoidance ──
  relationships.forEach((rel, i) => {
    const fromPos = entityPositions[rel.fromTable];
    const toPos = entityPositions[rel.toTable];
    if (!fromPos || !toPos) return;

    const relId = `rel-${i}`;

    // Midpoint between the two entities
    let mx = (fromPos.x + toPos.x) / 2;
    let my = (fromPos.y + toPos.y) / 2;

    // Apply a perpendicular offset so the diamond doesn't sit on the
    // straight line between entities (which often crosses other nodes)
    const dx = toPos.x - fromPos.x;
    const dy = toPos.y - fromPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    // Perpendicular direction (normalized)
    const perpX = -dy / dist;
    const perpY = dx / dist;

    // Alternate offset direction for each relationship to spread them out
    const sign = i % 2 === 0 ? 1 : -1;
    mx += perpX * DIAMOND_PERP_OFFSET * sign;
    my += perpY * DIAMOND_PERP_OFFSET * sign;

    // Nudge if colliding with any existing node
    const placed = nudgeAwayFromAll(
      mx + DIAMOND_HALF,
      my + DIAMOND_HALF,
      DIAMOND_HALF + 10,
      DIAMOND_HALF + 10,
      occupied
    );

    // Derive label from column name
    const label = rel.fromColumn
      .replace(/_id$/i, "")
      .replace(/_/g, " ")
      .toUpperCase();

    nodes.push({
      id: relId,
      type: "erRelationship",
      position: placed,
      data: { label: label || "FK" },
    });

    // Register in occupied
    occupied.push({
      cx: placed.x + DIAMOND_HALF,
      cy: placed.y + DIAMOND_HALF,
      hw: DIAMOND_HALF + 10,
      hh: DIAMOND_HALF + 10,
    });

    // Cardinality labels
    const fromLabel = "N";
    const toLabel = "1";

    edges.push({
      id: `edge-rel-from-${i}`,
      source: `entity-${rel.fromTable}`,
      target: relId,
      label: fromLabel,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: {
        fontSize: 12,
        fontWeight: 700,
        fill: "hsl(var(--foreground))",
      },
    });

    edges.push({
      id: `edge-rel-to-${i}`,
      source: relId,
      target: `entity-${rel.toTable}`,
      label: toLabel,
      style: { stroke: "hsl(var(--primary))", strokeWidth: 2 },
      labelStyle: {
        fontSize: 12,
        fontWeight: 700,
        fill: "hsl(var(--foreground))",
      },
    });
  });

  return { nodes, edges };
}

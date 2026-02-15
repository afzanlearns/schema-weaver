import ELK, { type ElkNode, type ElkPrimitiveEdge } from "elkjs/lib/elk.bundled";
import type { Table, Relationship } from "./types";
import { Position, type Node, type Edge } from "@xyflow/react";

const elk = new ELK();

export type LayoutOptions = {
    direction?: "DOWN" | "RIGHT";
    spacing?: "compact" | "balanced" | "spacious";
    grouping?: boolean;
};

export class LayoutEngine {
    private static SPACING_MAP = {
        compact: { nodeNode: 40, edgeNode: 40 },
        balanced: { nodeNode: 80, edgeNode: 60 },
        spacious: { nodeNode: 150, edgeNode: 100 },
    };

    /**
     * Main entry point to calculate layout
     */
    static async calculateLayout(
        tables: Table[],
        relationships: Relationship[],
        options: LayoutOptions = { direction: "RIGHT", spacing: "balanced", grouping: true }
    ): Promise<{ nodes: Node[]; edges: Edge[] }> {
        // Stage 1 & 2: Analysis & Grouping
        const { graph, parentMap } = this.buildGraph(tables, relationships, options);

        // Stage 3 & 4: ELK Layout & Routing
        const layout = await elk.layout(graph);

        // Stage 5: Transform back to React Flow
        return this.transformToReactFlow(layout, tables, relationships, parentMap);
    }

    /**
   * Builds the ELK graph structure from Schema Weaver types
   */
    private static buildGraph(
        tables: Table[],
        relationships: Relationship[],
        options: LayoutOptions
    ): { graph: ElkNode; parentMap: Map<string, string> } {
        const parentMap = new Map<string, string>();
        const children: ElkNode[] = [];
        // Use ElkExtendedEdge to support 'sources' and 'targets' arrays
        const edges: import("elkjs").ElkExtendedEdge[] = [];

        // --- Domain Clustering (Stage 2) ---
        // Detect connected components (clusters)
        const adjacency = new Map<string, Set<string>>();
        const enableGrouping = options.grouping ?? true;
        tables.forEach(t => adjacency.set(t.name, new Set()));
        relationships.forEach(r => {
            adjacency.get(r.fromTable)?.add(r.toTable);
            adjacency.get(r.toTable)?.add(r.fromTable);
        });

        const clusters: string[][] = [];
        const visited = new Set<string>();

        const getCluster = (startNode: string): string[] => {
            const cluster: string[] = [];
            const stack = [startNode];
            while (stack.length > 0) {
                const node = stack.pop()!;
                if (!visited.has(node)) {
                    visited.add(node);
                    cluster.push(node);
                    adjacency.get(node)?.forEach(n => {
                        if (!visited.has(n)) stack.push(n);
                    });
                }
            }
            return cluster;
        };

        tables.forEach(t => {
            if (!visited.has(t.name)) {
                clusters.push(getCluster(t.name));
            }
        });

        if (enableGrouping && clusters.length > 1) {
            clusters.forEach((cluster, i) => {
                const clusterId = `cluster-${i}`;
                const clusterChildren: ElkNode[] = [];

                cluster.forEach(tableName => {
                    const t = tables.find(tb => tb.name === tableName)!;
                    parentMap.set(tableName, clusterId);
                    clusterChildren.push({
                        id: t.name,
                        width: 220,
                        height: 40 + t.columns.length * 28,
                        layoutOptions: { "elk.padding": "[top=10,left=10,bottom=10,right=10]" },
                    });
                });

                // Add cluster node
                children.push({
                    id: clusterId,
                    children: clusterChildren,
                    layoutOptions: {
                        "elk.algorithm": "layered",
                        "elk.direction": "RIGHT",
                        "elk.spacing.nodeNode": "40", // Tighter spacing inside clusters
                    }
                });
            });
        } else {
            // Flat layout if no meaningful clusters or grouping disabled
            tables.forEach((t) => {
                children.push({
                    id: t.name,
                    width: 220,
                    height: 40 + t.columns.length * 28,
                });
            });
        }

        relationships.forEach((r, i) => {
            // Add edges. Use global IDs.
            // ELK handles routing between compound nodes automatically if hierarchy is correct.
            edges.push({
                id: `e-${i}`,
                sources: [r.fromTable],
                targets: [r.toTable],
            });
        });

        // Adaptive Spacing (Stage 5) & Density Modes
        // Base spacing from options
        const density = options.spacing || "balanced";
        const baseSettings = LayoutEngine.SPACING_MAP[density];

        // Scale spacing based on number of tables if needed, or stick to presets
        // User requested: "Spacing adjustments must scale proportionally with entity count"
        // Let's combine preset with a mild scaling factor for very large graphs
        const nodeCount = tables.length;
        const scalingFactor = nodeCount > 20 ? 1.2 : 1;

        const nodeNodeSpacing = Math.floor(baseSettings.nodeNode * scalingFactor).toString();
        const layerSpacing = Math.floor(baseSettings.edgeNode * 1.5 * scalingFactor).toString(); // EdgeNode is usually smaller, layer spacing needs to be larger

        // Edge Routing (Stage 4)
        const edgeRouting = "ORTHOGONAL";

        const direction = options.direction || "RIGHT";

        const graph: ElkNode = {
            id: "root",
            layoutOptions: {
                "elk.algorithm": "layered",
                "elk.direction": direction,
                "elk.spacing.nodeNode": nodeNodeSpacing,
                "elk.layered.spacing.nodeNodeBetweenLayers": layerSpacing,
                "elk.edgeRouting": edgeRouting,
                "elk.separateConnectedComponents": "false",
                "elk.padding": "[top=50,left=50,bottom=50,right=50]",
            },
            children,
            edges,
        };

        return { graph, parentMap };
    }

    /**
   * Transforms ELK output back to React Flow nodes/edges
   */
    private static transformToReactFlow(
        layout: ElkNode,
        tables: Table[],
        relationships: Relationship[],
        parentMap: Map<string, string>
    ): { nodes: Node[]; edges: Edge[] } {
        const nodes: Node[] = [];

        // Recursive function to process nodes
        const processNode = (elkNode: ElkNode, parentId?: string) => {
            // Check if it's a cluster
            if (elkNode.children && elkNode.children.length > 0 && elkNode.id !== "root") {
                nodes.push({
                    id: elkNode.id,
                    type: "group", // Use a group node type (needs to be registered in React Flow)
                    position: { x: elkNode.x || 0, y: elkNode.y || 0 },
                    data: { label: "Domain Cluster" },
                    style: {
                        width: elkNode.width,
                        height: elkNode.height,
                        backgroundColor: "hsl(var(--card) / 0.3)",
                        border: "1px dashed hsl(var(--border))",
                        borderRadius: "8px",
                    },
                    // width/height in style or directly on node depending on RF version/usage
                    width: elkNode.width,
                    height: elkNode.height,
                });

                // Process children
                elkNode.children.forEach(child => processNode(child, elkNode.id));
                return;
            }

            // It's a table node
            const table = tables.find((t) => t.name === elkNode.id);
            if (table) {
                nodes.push({
                    id: elkNode.id,
                    type: "tableNode",
                    position: { x: elkNode.x || 0, y: elkNode.y || 0 },
                    data: { label: table.name, columns: table.columns },
                    parentId: parentId, // React Flow parent-child linkage
                    extent: parentId ? "parent" : undefined, // Optional: constrain to parent
                    width: elkNode.width,
                    height: elkNode.height,
                });
            } else if (elkNode.id !== "root") {
                // Fallback for non-table nodes (shouldn't happen with current logic unless we add other node types)
            }

            // If root has direct children (no clusters or mixed), process them
            if (elkNode.id === "root" && elkNode.children) {
                elkNode.children.forEach(child => processNode(child));
            }
        };

        processNode(layout);

        const edges: Edge[] = relationships.map((r, i) => ({
            id: `e-${i}`,
            source: r.fromTable,
            target: r.toTable,
            label: `${r.fromColumn} → ${r.toColumn}`,
            type: "smoothstep",
            style: { stroke: "rgba(148,163,184,0.45)", strokeWidth: 2 },
            labelStyle: { fontSize: 10, fill: "hsl(var(--foreground))" },
            labelBgStyle: { fill: "hsl(var(--card))", fillOpacity: 0.95 },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 4,
            animated: false,
        }));

        return { nodes, edges };
    }
}

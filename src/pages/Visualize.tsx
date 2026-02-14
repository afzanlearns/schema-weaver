import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { parseSQL } from "@/lib/sql-parser";
import { generateAllInterfaces } from "@/lib/ts-generator";
import { generateMarkdown } from "@/lib/markdown-exporter";
import { saveDiagram } from "@/lib/storage";
import { generateERNodesAndEdges } from "@/lib/er-layout";
import { LayoutEngine, type LayoutOptions } from "@/lib/layout-engine";
import type { ParseResult, Table } from "@/lib/types";
import TableNode from "@/components/TableNode";
import EREntityNode from "@/components/EREntityNode";
import ERAttributeNode from "@/components/ERAttributeNode";
import ERRelationshipNode from "@/components/ERRelationshipNode";
import TableDetailPanel from "@/components/TableDetailPanel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  LayoutGrid,
  FileText,
  FileJson,
  Code,
  Save,
  Database,
  Eye,
  Table as TableIcon,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";

const schemaNodeTypes = { tableNode: TableNode };
const erNodeTypes = {
  erEntity: EREntityNode,
  erAttribute: ERAttributeNode,
  erRelationship: ERRelationshipNode,
};

const Visualize = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<"schema" | "er">("schema");

  // Layout Controls State
  const [layoutDir, setLayoutDir] = useState<"RIGHT" | "DOWN">("RIGHT");
  const [layoutSpacing, setLayoutSpacing] = useState<"compact" | "balanced" | "spacious">("balanced");
  const [enableGrouping, setEnableGrouping] = useState(true);

  // Focus Mode State
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const applyLayout = useCallback(async (parsed: ParseResult) => {
    if (viewMode === "er") {
      // Existing ER View logic (keeps old layout for now or needs update if Part 2 touches this)
      const { nodes: erNodes, edges: erEdges } = generateERNodesAndEdges(parsed.tables, parsed.relationships);
      setNodes(erNodes);
      setEdges(erEdges);
      return;
    }

    try {
      const { nodes: layoutNodes, edges: layoutEdges } = await LayoutEngine.calculateLayout(
        parsed.tables,
        parsed.relationships,
        { direction: layoutDir, spacing: layoutSpacing, grouping: enableGrouping }
      );
      setNodes(layoutNodes);
      setEdges(layoutEdges);
    } catch (error) {
      console.error("Layout calculation failed:", error);
      toast.error("Layout calculation failed");
    }
  }, [viewMode, layoutDir, layoutSpacing, enableGrouping, setNodes, setEdges]);

  useEffect(() => {
    const sql = sessionStorage.getItem("schemamap-sql");
    if (!sql) { navigate("/"); return; }
    const parsed = parseSQL(sql);
    setResult(parsed);
    if (parsed.errors.length > 0) parsed.errors.forEach((e) => toast.warning(e));

    // Initial layout
    applyLayout(parsed);
  }, [navigate, applyLayout]);

  // Focus Mode Logic
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (!focusedNodeId) {
          return { ...node, style: { ...node.style, opacity: 1 } };
        }
        const isFocused = node.id === focusedNodeId;
        const isNeighbor = edges.some(
          (e) => (e.source === focusedNodeId && e.target === node.id) || (e.target === focusedNodeId && e.source === node.id)
        );
        const isCluster = node.type === 'group'; // Keep clusters visible-ish? Or dim them too.

        return {
          ...node,
          style: {
            ...node.style,
            opacity: isFocused || isNeighbor ? 1 : 0.2,
            transition: 'opacity 0.2s ease-in-out',
          },
        };
      })
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          strokeOpacity: !focusedNodeId || edge.source === focusedNodeId || edge.target === focusedNodeId ? 1 : 0.1,
          stroke: !focusedNodeId || edge.source === focusedNodeId || edge.target === focusedNodeId ? "hsl(var(--muted-foreground))" : "hsl(var(--muted))",
        },
        animated: edge.source === focusedNodeId || edge.target === focusedNodeId,
      }))
    );
  }, [focusedNodeId, edges, setNodes, setEdges]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setFocusedNodeId(node.id);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setFocusedNodeId(null);
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (viewMode !== "schema") return;
      const table = result?.tables.find((t) => t.name === node.id);
      if (table) setSelectedTable(table);
    },
    [result, viewMode]
  );

  const handleExportMarkdown = () => {
    if (!result) return;
    const md = generateMarkdown(result);
    downloadFile(md, "schema-docs.md", "text/markdown");
    toast.success("Markdown exported");
  };

  const handleExportJSON = () => {
    if (!result) return;
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => { positions[n.id] = { x: n.position.x, y: n.position.y }; });
    const data = { schema: result, positions };
    downloadFile(JSON.stringify(data, null, 2), "schema-layout.json", "application/json");
    toast.success("JSON layout exported");
  };

  const handleGenerateAllTS = () => {
    if (!result) return;
    const ts = generateAllInterfaces(result.tables);
    navigator.clipboard.writeText(ts);
    toast.success("All TypeScript interfaces copied to clipboard!");
  };

  const handleSave = () => {
    if (!result) return;
    const sql = sessionStorage.getItem("schemamap-sql") || "";
    const positions: Record<string, { x: number; y: number }> = {};
    nodes.forEach((n) => { positions[n.id] = { x: n.position.x, y: n.position.y }; });
    const diagram = {
      id: `diagram-${Date.now()}`,
      name: result.tables.map((t) => t.name).slice(0, 3).join(", ") + (result.tables.length > 3 ? "..." : ""),
      sql,
      tableCount: result.tables.length,
      dateSaved: new Date().toISOString(),
      nodePositions: positions,
    };
    saveDiagram(diagram);
    toast.success("Diagram saved to browser");
  };

  const currentNodeTypes = viewMode === "schema" ? schemaNodeTypes : erNodeTypes;

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b border-border px-4 py-2 flex items-center gap-2 flex-wrap bg-card">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="h-4 w-px bg-border mx-1" />

        {/* View mode toggle */}
        <div className="flex border border-border rounded overflow-hidden">
          <button
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "schema" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
              }`}
            onClick={() => setViewMode("schema")}
          >
            <TableIcon className="h-3.5 w-3.5" /> Schema
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "er" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
              }`}
            onClick={() => setViewMode("er")}
          >
            <Eye className="h-3.5 w-3.5" /> ER Diagram
          </button>
        </div>

        {/* Layout Controls */}
        {viewMode === "schema" && (
          <>
            <div className="h-4 w-px bg-border mx-1" />
            <Select value={layoutDir} onValueChange={(v: "RIGHT" | "DOWN") => setLayoutDir(v)}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue placeholder="Direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RIGHT">Horizontal</SelectItem>
                <SelectItem value="DOWN">Vertical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={layoutSpacing} onValueChange={(v: any) => setLayoutSpacing(v)}>
              <SelectTrigger className="h-8 w-[100px] text-xs">
                <SelectValue placeholder="Spacing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Switch id="grouping" checked={enableGrouping} onCheckedChange={setEnableGrouping} />
              <Label htmlFor="grouping" className="text-xs">Cluster</Label>
            </div>

            <Button variant="outline" size="sm" onClick={() => result && applyLayout(result)} title="Re-calculate Layout">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </>
        )}

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleExportMarkdown} title="Export Markdown">
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleExportJSON} title="Export JSON">
            <FileJson className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleGenerateAllTS} title="Copy TypeScript">
            <Code className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleSave} title="Save Diagram">
            <Save className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            nodeTypes={currentNodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
          >
            <Background />
            <Controls />
            <MiniMap
              nodeColor={() => "hsl(var(--primary))"}
              maskColor="hsl(var(--background) / 0.7)"
            />
            <Panel position="bottom-right" className="bg-background/80 p-2 rounded border border-border text-xs text-muted-foreground">
              {result?.tables.length ?? 0} tables • {edges.length} relationships
            </Panel>
          </ReactFlow>
        </div>
        {selectedTable && viewMode === "schema" && (
          <TableDetailPanel
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
          />
        )}
      </div>
    </div>
  );
};

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default Visualize;

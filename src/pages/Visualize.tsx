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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { parseSQL } from "@/lib/sql-parser";
import { generateAllInterfaces } from "@/lib/ts-generator";
import { generateMarkdown } from "@/lib/markdown-exporter";
import { saveDiagram } from "@/lib/storage";
import { generateERNodesAndEdges } from "@/lib/er-layout";
import type { ParseResult, Table } from "@/lib/types";
import TableNode from "@/components/TableNode";
import EREntityNode from "@/components/EREntityNode";
import ERAttributeNode from "@/components/ERAttributeNode";
import ERRelationshipNode from "@/components/ERRelationshipNode";
import TableDetailPanel from "@/components/TableDetailPanel";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { toast } from "sonner";

const schemaNodeTypes = { tableNode: TableNode };
const erNodeTypes = {
  erEntity: EREntityNode,
  erAttribute: ERAttributeNode,
  erRelationship: ERRelationshipNode,
};

function autoLayout(tables: Table[]): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  const cols = Math.ceil(Math.sqrt(tables.length));
  tables.forEach((t, i) => {
    positions[t.name] = {
      x: (i % cols) * 320,
      y: Math.floor(i / cols) * 300,
    };
  });
  return positions;
}

const Visualize = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<"schema" | "er">("schema");

  const buildSchemaView = useCallback((parsed: ParseResult) => {
    const positions = autoLayout(parsed.tables);
    const newNodes: Node[] = parsed.tables.map((t) => ({
      id: t.name,
      type: "tableNode",
      position: positions[t.name],
      data: { label: t.name, columns: t.columns },
    }));
    const newEdges: Edge[] = parsed.relationships.map((r, i) => ({
      id: `e-${i}`,
      source: r.toTable,
      target: r.fromTable,
      sourceHandle: null,
      targetHandle: null,
      label: `${r.fromColumn} → ${r.toColumn}`,
      style: { stroke: "hsl(var(--muted-foreground))" },
      labelStyle: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
      animated: true,
    }));
    setNodes(newNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  const buildERView = useCallback((parsed: ParseResult) => {
    const { nodes: erNodes, edges: erEdges } = generateERNodesAndEdges(parsed.tables, parsed.relationships);
    setNodes(erNodes);
    setEdges(erEdges);
  }, [setNodes, setEdges]);

  useEffect(() => {
    const sql = sessionStorage.getItem("schemamap-sql");
    if (!sql) { navigate("/"); return; }
    const parsed = parseSQL(sql);
    setResult(parsed);
    if (parsed.errors.length > 0) parsed.errors.forEach((e) => toast.warning(e));
    if (viewMode === "schema") buildSchemaView(parsed);
    else buildERView(parsed);
  }, [navigate, viewMode, buildSchemaView, buildERView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (viewMode !== "schema") return;
      const table = result?.tables.find((t) => t.name === node.id);
      if (table) setSelectedTable(table);
    },
    [result, viewMode]
  );

  const handleAutoLayout = () => {
    if (!result) return;
    if (viewMode === "schema") {
      const positions = autoLayout(result.tables);
      setNodes((nds) => nds.map((n) => ({ ...n, position: positions[n.id] || n.position })));
    } else {
      buildERView(result);
    }
  };

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
      <div className="border-b border-border px-4 py-2 flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <div className="h-4 w-px bg-border mx-1" />

        {/* View mode toggle */}
        <div className="flex border border-border rounded overflow-hidden">
          <button
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === "schema" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
            }`}
            onClick={() => setViewMode("schema")}
          >
            <TableIcon className="h-3.5 w-3.5" /> Schema
          </button>
          <button
            className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${
              viewMode === "er" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"
            }`}
            onClick={() => setViewMode("er")}
          >
            <Eye className="h-3.5 w-3.5" /> ER Diagram
          </button>
        </div>

        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="outline" size="sm" onClick={handleAutoLayout}>
          <LayoutGrid className="h-4 w-4 mr-1" /> Auto Layout
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
          <FileText className="h-4 w-4 mr-1" /> Markdown
        </Button>
        <Button variant="outline" size="sm" onClick={handleExportJSON}>
          <FileJson className="h-4 w-4 mr-1" /> JSON
        </Button>
        <Button variant="outline" size="sm" onClick={handleGenerateAllTS}>
          <Code className="h-4 w-4 mr-1" /> All TypeScript
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> Save
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          {result?.tables.length ?? 0} tables
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
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

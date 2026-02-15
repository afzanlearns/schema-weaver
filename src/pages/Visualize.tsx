import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toPng } from "html-to-image";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type ReactFlowInstance,
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
import { SnapshotModal } from "@/components/SnapshotModal";
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
  Camera,
  Database,
  Eye,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { ERLegend, type LegendType } from "@/components/ERLegend";

const schemaNodeTypes = { tableNode: TableNode };
const erNodeTypes = {
  erEntity: EREntityNode,
  erAttribute: ERAttributeNode,
  erRelationship: ERRelationshipNode,
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="h-8 w-8"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block dark:hidden" />
    </Button>
  );
};

const Visualize = () => {
  const { setTheme, theme } = useTheme();
  const navigate = useNavigate();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [viewMode, setViewMode] = useState<"schema" | "er">("schema");

  // Interaction Mode State
  const [interactionMode, setInteractionMode] = useState<"inspect" | "relations">("inspect");

  // Layout Controls State
  const [layoutDir, setLayoutDir] = useState<"RIGHT" | "DOWN">("RIGHT");
  const [layoutSpacing, setLayoutSpacing] = useState<"compact" | "balanced" | "spacious">("balanced");
  const [enableGrouping, setEnableGrouping] = useState(true);

  // Focus/Highlight State
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  // Fit View State
  const rfInstance = useRef<ReactFlowInstance<any, any> | null>(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  // Canvas hint dismissed
  const [hintDismissed, setHintDismissed] = useState(false);

  // Mobile detection for legend behavior split
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Lock body scroll on mobile to prevent page scrolling past the canvas
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isMobile]);

  // Legend Highlight State
  const [legendHover, setLegendHover] = useState<LegendType>(null);
  const [lockedLegend, setLockedLegend] = useState<LegendType>(null);

  // Desktop: hover drives highlight. Mobile: click-lock drives highlight.
  const legendHighlight = isMobile ? lockedLegend : (legendHover || lockedLegend);

  const handleLegendClick = useCallback((type: LegendType) => {
    setLockedLegend((prev) => (prev === type ? null : type));
  }, []);

  // Snapshot state
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const handleSnapshot = useCallback(async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    toast.info("Capturing snapshot…");
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue("--background").trim()
          ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
          : "#ffffff",
        pixelRatio: 2,
      });
      setSnapshotUrl(dataUrl);
    } catch (err) {
      toast.error("Failed to capture snapshot");
    }
  }, []);

  const applyLayout = useCallback(async (parsed: ParseResult) => {
    if (viewMode === "er") {
      const { nodes: erNodes, edges: erEdges } = generateERNodesAndEdges(parsed.tables, parsed.relationships);
      setNodes(erNodes);
      setEdges(erEdges);
      setLayoutVersion((v) => v + 1);
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
      setLayoutVersion((v) => v + 1);
    } catch (error) {
      console.error("Layout calculation failed:", error);
      toast.error("Layout calculation failed");
    }
  }, [viewMode, layoutDir, layoutSpacing, enableGrouping, setNodes, setEdges]);

  // Auto Fit View after layout changes
  useEffect(() => {
    if (layoutVersion === 0) return;
    const timer = setTimeout(() => {
      if (rfInstance.current) {
        rfInstance.current.fitView({ padding: isMobile ? 0.3 : 0.15, duration: 300 });
        toast.info("Diagram adjusted to fit screen", { duration: 1500 });
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [layoutVersion]);

  useEffect(() => {
    const sql = sessionStorage.getItem("schemamap-sql");
    if (!sql) { navigate("/"); return; }
    const parsed = parseSQL(sql);
    setResult(parsed);
    if (parsed.errors.length > 0) parsed.errors.forEach((e) => toast.warning(e));

    applyLayout(parsed);
  }, [navigate, applyLayout]);

  // Update draggable state when interaction mode changes
  useEffect(() => {
    setNodes((nds) => nds.map((n) => ({
      ...n,
      draggable: interactionMode === "inspect",
      style: { ...n.style, opacity: 1 } as React.CSSProperties,
    })));
  }, [interactionMode, setNodes]);

  // Focus/Highlight Logic — only active in "relations" mode
  useEffect(() => {
    if (interactionMode !== "relations") {
      setNodes((nds) => nds.map(n => ({ ...n, style: { ...n.style, opacity: 1 } })));
      setEdges((eds) => eds.map(e => ({
        ...e,
        style: { ...e.style, strokeOpacity: 1, stroke: "hsl(var(--muted-foreground))" },
        animated: false,
      })));
      return;
    }

    setNodes((nds) =>
      nds.map((node) => {
        if (!focusedNodeId) {
          return { ...node, style: { ...node.style, opacity: 1 } };
        }
        const isFocused = node.id === focusedNodeId;
        const isNeighbor = edges.some(
          (e) => (e.source === focusedNodeId && e.target === node.id) || (e.target === focusedNodeId && e.source === node.id)
        );
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
          stroke: !focusedNodeId || edge.source === focusedNodeId || edge.target === focusedNodeId ? "hsl(var(--primary))" : "hsl(var(--muted))",
        },
        animated: edge.source === focusedNodeId || edge.target === focusedNodeId,
      }))
    );
  }, [focusedNodeId, edges, setNodes, setEdges, interactionMode]);

  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    if (interactionMode === "relations") setFocusedNodeId(node.id);
  }, [interactionMode]);

  const onNodeMouseLeave = useCallback(() => {
    if (interactionMode === "relations") setFocusedNodeId(null);
  }, [interactionMode]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (interactionMode !== "inspect") return;
      if (viewMode !== "schema") return;
      const table = result?.tables.find((t) => t.name === node.id);
      if (table) setSelectedTable(table);
    },
    [result, viewMode, interactionMode]
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
    <div className="h-screen flex flex-col bg-background visualize-root">
      {/* ═══ Toolbar ═══ */}
      <div className="border-b border-border dark:border-[rgba(148,163,184,0.15)] bg-card dark:bg-[#020617]">

        {/* ── Desktop toolbar (md+): original single-row ── */}
        <div className="hidden md:flex px-4 py-2 items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="h-4 w-px bg-border mx-1" />

          <div className="flex border border-border rounded overflow-hidden">
            <button
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "schema" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
              onClick={() => setViewMode("schema")}
            >
              <TableIcon className="h-3.5 w-3.5" /> Schema
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === "er" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
              onClick={() => setViewMode("er")}
            >
              <Eye className="h-3.5 w-3.5" /> ER Diagram
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          <div className="flex border border-border rounded overflow-hidden">
            <button
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${interactionMode === "inspect" ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
              onClick={() => setInteractionMode("inspect")}
              title="Inspect Mode: Drag nodes, click to view details"
            >
              <Maximize2 className="h-3.5 w-3.5" /> Inspect
            </button>
            <button
              className={`px-3 py-1 text-xs font-medium flex items-center gap-1 transition-colors ${interactionMode === "relations" ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
              onClick={() => setInteractionMode("relations")}
              title="Relations Mode: Hover to trace connections, fixed layout"
            >
              <Minimize2 className="h-3.5 w-3.5" /> Relations
            </button>
          </div>

          {viewMode === "schema" && (
            <>
              <div className="h-4 w-px bg-border/50 mx-1" />
              <div className="flex items-center gap-1.5">
                <Select value={layoutDir} onValueChange={(v: "RIGHT" | "DOWN") => setLayoutDir(v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RIGHT">Horizontal</SelectItem>
                    <SelectItem value="DOWN">Vertical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={layoutSpacing} onValueChange={(v: any) => setLayoutSpacing(v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue placeholder="Spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-1.5">
                  <Switch id="grouping-desktop" checked={enableGrouping} onCheckedChange={setEnableGrouping} />
                  <Label htmlFor="grouping-desktop" className="text-xs">Cluster</Label>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => result && applyLayout(result)} title="Re-calculate Layout">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <div className="h-4 w-px bg-border mx-0.5" />
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
            <div className="h-4 w-px bg-border mx-0.5" />
            <Button variant="ghost" size="icon" onClick={handleSnapshot} title="Snapshot">
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Mobile toolbar (<md): compact two-row ── */}
        <div className="md:hidden">
          {/* Row 1: Back + View Toggle + Actions */}
          <div className="px-3 py-1.5 flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Toggle Group - shrink-0 to ensure visibility */}
            <div className="grid grid-cols-2 border border-border rounded overflow-hidden shrink-0">
              <button
                className={`px-2 py-1 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${viewMode === "schema" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
                onClick={() => setViewMode("schema")}
              >
                <TableIcon className="h-3.5 w-3.5" /> Schema
              </button>
              <button
                className={`px-2 py-1 text-xs font-medium flex items-center justify-center gap-1 transition-colors ${viewMode === "er" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
                onClick={() => setViewMode("er")}
              >
                <Eye className="h-3.5 w-3.5" /> ER Diagram
              </button>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSave} title="Save Diagram">
                <Save className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSnapshot} title="Snapshot">
                <Camera className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                    Toggle Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportMarkdown}>
                    <FileText className="h-4 w-4 mr-2" /> Export Markdown
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportJSON}>
                    <FileJson className="h-4 w-4 mr-2" /> Export JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGenerateAllTS}>
                    <Code className="h-4 w-4 mr-2" /> Copy TypeScript
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Row 2: Interaction Mode + Layout Controls */}
          <div className="px-3 py-2 flex items-center gap-2 border-t border-border/30 flex-wrap">
            <div className="flex border border-border rounded overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${interactionMode === "inspect" ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
                onClick={() => setInteractionMode("inspect")}
                title="Inspect Mode"
              >
                <Maximize2 className="h-3 w-3" /> Inspect
              </button>
              <button
                className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${interactionMode === "relations" ? "bg-secondary text-secondary-foreground" : "bg-card text-foreground hover:bg-muted/30"}`}
                onClick={() => setInteractionMode("relations")}
                title="Relations Mode"
              >
                <Minimize2 className="h-3 w-3" /> Relations
              </button>
            </div>

            {viewMode === "schema" && (
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={layoutDir} onValueChange={(v: "RIGHT" | "DOWN") => setLayoutDir(v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RIGHT">Horizontal</SelectItem>
                    <SelectItem value="DOWN">Vertical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={layoutSpacing} onValueChange={(v: any) => setLayoutSpacing(v)}>
                  <SelectTrigger className="h-7 w-[100px] text-xs">
                    <SelectValue placeholder="Spacing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-1.5">
                  <Switch id="grouping-mobile" checked={enableGrouping} onCheckedChange={setEnableGrouping} />
                  <Label htmlFor="grouping-mobile" className="text-xs">Cluster</Label>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => result && applyLayout(result)} title="Re-calculate Layout">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className={`flex-1 relative min-h-0 ${legendHighlight ? `legend-highlight-${legendHighlight}` : ''}`} style={{ touchAction: 'none' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={(e, node) => { setHintDismissed(true); onNodeClick(e, node); }}
            onNodeMouseEnter={(e, node) => { setHintDismissed(true); onNodeMouseEnter(e, node); }}
            onNodeMouseLeave={onNodeMouseLeave}
            nodeTypes={currentNodeTypes}
            onInit={(instance) => { rfInstance.current = instance; }}
            minZoom={0.1}
            maxZoom={2}
            fitView
            fitViewOptions={{ padding: isMobile ? 0.3 : 0.15 }}
            proOptions={{ hideAttribution: true }}
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
            {/* Canvas guidance hint */}
            {!hintDismissed && (result?.tables.length ?? 0) <= 4 && nodes.length > 0 && (
              <Panel position="top-center" className="mt-4">
                <div className="text-xs text-muted-foreground/60 bg-card/60 backdrop-blur-sm px-4 py-2 rounded-full border border-border/30 shadow-sm">
                  Drag nodes to explore • hover to trace relationships
                </div>
              </Panel>
            )}
            {viewMode === "er" && (result?.tables.length ?? 0) > 0 && (
              <ERLegend
                onHover={isMobile ? undefined : setLegendHover}
                onClick={handleLegendClick}
                lockedType={lockedLegend}
              />
            )}
          </ReactFlow>
        </div>
        {selectedTable && viewMode === "schema" && result && (
          <TableDetailPanel
            table={selectedTable}
            allTables={result.tables}
            relationships={result.relationships}
            onClose={() => setSelectedTable(null)}
          />
        )}
      </div>

      {/* Snapshot modal */}
      {snapshotUrl && (
        <SnapshotModal imageDataUrl={snapshotUrl} onClose={() => setSnapshotUrl(null)} />
      )}
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

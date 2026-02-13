import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SAMPLE_SIMPLE, SAMPLE_INLINE_FK, SAMPLE_WORDPRESS } from "@/lib/sample-sql";
import { parseSQL } from "@/lib/sql-parser";
import { toast } from "sonner";

const Index = () => {
  const [sqlText, setSqlText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSqlText(ev.target?.result as string);
        toast.success("File loaded successfully");
      };
      reader.readAsText(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSqlText(ev.target?.result as string);
        toast.success("File loaded successfully");
      };
      reader.readAsText(file);
    }
  }, []);

  const handleParse = () => {
    if (!sqlText.trim()) {
      toast.error("Please enter or upload some SQL first");
      return;
    }
    const result = parseSQL(sqlText);
    if (result.tables.length === 0) {
      toast.error("No tables found. Check your SQL syntax.");
      return;
    }
    // Store SQL in sessionStorage for the visualize page
    sessionStorage.setItem("schemamap-sql", sqlText);
    navigate("/visualize");
  };

  const loadSample = (sql: string, name: string) => {
    setSqlText(sql);
    toast.success(`Loaded "${name}" sample`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">SchemaMap</h1>
          </div>
          <nav className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate("/my-diagrams")}>
              My Diagrams
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">SQL → ER Diagram</h2>
          <p className="text-muted-foreground">
            Paste SQL or upload a .sql file to visualize your schema as an interactive ER diagram.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-foreground font-medium">Drop .sql file here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Supports PostgreSQL and MySQL syntax</p>
          <input
            id="file-input"
            type="file"
            accept=".sql,.txt"
            className="hidden"
            onChange={handleFileInput}
          />
        </div>

        {/* Textarea */}
        <Textarea
          placeholder="Or paste your CREATE TABLE statements here..."
          className="min-h-[200px] font-mono text-sm mb-6"
          value={sqlText}
          onChange={(e) => setSqlText(e.target.value)}
        />

        {/* Sample buttons */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground mb-3">Try a sample:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_SIMPLE, "Simple Blog")}>
              <FileText className="h-4 w-4 mr-1" />
              Simple Blog
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_INLINE_FK, "Inline FKs")}>
              <FileText className="h-4 w-4 mr-1" />
              Inline FKs
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_WORDPRESS, "WordPress-like")}>
              <FileText className="h-4 w-4 mr-1" />
              WordPress-like
            </Button>
          </div>
        </div>

        {/* Parse button */}
        <Button className="w-full" size="lg" onClick={handleParse}>
          <Zap className="h-5 w-5 mr-2" />
          Parse & Visualize
        </Button>
      </main>
    </div>
  );
};

export default Index;

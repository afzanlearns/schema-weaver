import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, Database, Zap, Code, FileJson, Save, LayoutGrid, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { SAMPLE_SIMPLE, SAMPLE_INLINE_FK, SAMPLE_WORDPRESS } from "@/lib/sample-sql";
import { parseSQL } from "@/lib/sql-parser";
import { toast } from "sonner";

const FEATURES = [
  { icon: Database, title: "SQL to ER Diagram", desc: "Instantly visualize your CREATE TABLE statements as interactive, draggable entity-relationship diagrams." },
  { icon: Eye, title: "Full ER Diagram Mode", desc: "Switch to Chen notation with entities, attributes as ovals, and relationship diamonds with cardinality labels." },
  { icon: Code, title: "TypeScript Interfaces", desc: "Auto-generate clean TypeScript interfaces from your schema with proper type mapping and nullable fields." },
  { icon: FileText, title: "Markdown Export", desc: "Export complete schema documentation as Markdown — ready for your repo wiki or README." },
  { icon: FileJson, title: "JSON Layout Export", desc: "Save diagram positions and schema data as JSON for version control or re-importing." },
  { icon: Save, title: "Save & Reload", desc: "Persist diagrams to your browser and reload them anytime — no account required." },
];

const FAQS = [
  { q: "What SQL dialects are supported?", a: "Schema Weaver supports PostgreSQL and MySQL CREATE TABLE syntax, including inline and out-of-line foreign keys, composite primary keys, and common column constraints." },
  { q: "Does the app execute SQL queries?", a: "No. Schema Weaver only parses your SQL text client-side to extract structure. It never connects to a database or executes any statements." },
  { q: "Can I edit diagrams after generation?", a: "Yes. You can drag and reposition nodes, auto-layout, and save your custom arrangement to your browser for later." },
  { q: "How are TypeScript types derived?", a: "SQL types are mapped to TypeScript equivalents: INT → number, VARCHAR → string, BOOLEAN → boolean, JSON → Record<string, unknown>, TIMESTAMP → string, and so on. Nullable columns become optional fields." },
  { q: "Is my schema stored securely?", a: "All data stays in your browser. Schema Weaver uses localStorage for saved diagrams and sessionStorage for the active session. Nothing is sent to any server." },
];

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
    sessionStorage.setItem("schemamap-sql", sqlText);
    navigate("/visualize");
  };

  const loadSample = (sql: string, name: string) => {
    setSqlText(sql);
    toast.success(`Loaded "${name}" sample`);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Schema Weaver</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => scrollTo("features")}>Features</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("about")}>About</Button>
            <Button variant="ghost" size="sm" onClick={() => scrollTo("faq")}>FAQ</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/my-diagrams")}>My Diagrams</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-foreground mb-3 tracking-tight">
            Transform SQL into Visual Schema Diagrams
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Paste or upload your SQL to instantly generate interactive ER diagrams, TypeScript interfaces, and documentation — all in your browser.
          </p>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-5 transition-colors cursor-pointer ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="h-9 w-9 mx-auto mb-2 text-muted-foreground" />
          <p className="text-foreground font-medium">Drop .sql file here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">Supports PostgreSQL and MySQL syntax</p>
          <input id="file-input" type="file" accept=".sql,.txt" className="hidden" onChange={handleFileInput} />
        </div>

        <Textarea
          placeholder="Or paste your CREATE TABLE statements here..."
          className="min-h-[180px] font-mono text-sm mb-5"
          value={sqlText}
          onChange={(e) => setSqlText(e.target.value)}
        />

        <div className="mb-5">
          <p className="text-sm text-muted-foreground mb-2">Try a sample:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_SIMPLE, "Simple Blog")}>
              <FileText className="h-4 w-4 mr-1" /> Simple Blog
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_INLINE_FK, "Inline FKs")}>
              <FileText className="h-4 w-4 mr-1" /> Inline FKs
            </Button>
            <Button variant="outline" size="sm" onClick={() => loadSample(SAMPLE_WORDPRESS, "WordPress-like")}>
              <FileText className="h-4 w-4 mr-1" /> WordPress-like
            </Button>
          </div>
        </div>

        <Button className="w-full" size="lg" onClick={handleParse}>
          <Zap className="h-5 w-5 mr-2" /> Visualize Schema
        </Button>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/50 py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-card border-border">
                <CardContent className="pt-6">
                  <f.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 border-t border-border">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">About Schema Weaver</h2>
          <p className="text-muted-foreground leading-relaxed">
            Schema Weaver was built to simplify how developers understand and communicate database structures. Whether you're onboarding onto a legacy codebase, reviewing a migration, or documenting your schema for your team, Schema Weaver turns raw SQL into clear, interactive diagrams and type-safe code — entirely client-side, with zero setup.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 border-t border-border bg-card/50">
        <div className="container mx-auto px-4 max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">Schema Weaver</span>
            <span>— SQL to ER diagrams, instantly.</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => scrollTo("features")} className="hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo("about")} className="hover:text-foreground transition-colors">About</button>
            <button onClick={() => scrollTo("faq")} className="hover:text-foreground transition-colors">FAQ</button>
          </div>
          <span>© {new Date().getFullYear()} Schema Weaver</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;

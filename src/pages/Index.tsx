import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  Database,
  Zap,
  Code,
  GitBranch,
  FileDown,
  MousePointerClick,
  Eye,
  Sun,
  Moon,
  Menu,
  Github,
  BookOpen,
  ArrowRight,
  Terminal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { SAMPLE_SIMPLE, SAMPLE_INLINE_FK, SAMPLE_WORDPRESS } from "@/lib/sample-sql";
import { parseSQL } from "@/lib/sql-parser";
import { toast } from "sonner";
import { useTheme } from "next-themes";

/* ──────────────────────────────────────────────
   Data
   ────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Database,
    title: "SQL → ER & Schema Diagrams",
    desc: "Instantly transform raw CREATE TABLE statements into both conceptual ER diagrams and structured schema views for complete structural understanding.",
  },
  {
    icon: GitBranch,
    title: "Interactive Relationship Exploration",
    desc: "Hover over any node to visually trace its direct relationships across the graph, making dependencies and data flow immediately clear.",
  },
  {
    icon: MousePointerClick,
    title: "Inspect & Edit Mode",
    desc: "Select nodes to view detailed properties, constraints, and connections, and freely reposition them to explore schema structure interactively.",
  },
  {
    icon: Sparkles,
    title: "Intelligent Layout Modes",
    desc: "Automatically adapt diagram organization using cluster, compact, and spacious modes to keep even complex schemas readable.",
  },
  {
    icon: Code,
    title: "Type-Safe Interface Generation",
    desc: "Generate clean TypeScript interfaces directly from your schema with accurate type mapping and nullability awareness.",
  },
  {
    icon: FileDown,
    title: "Instant Documentation Export",
    desc: "Export complete schema documentation as structured Markdown, ready for READMEs, onboarding guides, and internal docs.",
  },
];

const FAQS = [
  {
    q: "Does the app execute SQL queries?",
    a: "No. Schema Weaver only parses SQL definitions to extract structural information. It never executes queries or connects to your database.",
  },
  {
    q: "Is my schema processed client-side?",
    a: "Yes. All parsing and diagram generation happen entirely in your browser. Your SQL is not sent to any server unless you explicitly save a diagram.",
  },
  {
    q: "Can I edit diagrams after generation?",
    a: "Yes. In Inspect mode, you can drag and reposition nodes, explore properties, and interactively adjust the layout while preserving relationships.",
  },
  {
    q: "What is the difference between ER and Schema diagram modes?",
    a: "ER mode presents a conceptual view with entities, attributes, and relationships, while Schema mode shows a structured table-centric view with columns, keys, and constraints.",
  },
  {
    q: "How are TypeScript interfaces generated?",
    a: "TypeScript types are derived by mapping SQL column definitions to their closest TypeScript equivalents, including handling nullability and defaults.",
  },
];

const DEMO_SQL = `CREATE TABLE users (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE
);

CREATE TABLE orders (
  id      SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total   DECIMAL(10,2),
  status  VARCHAR(20) DEFAULT 'pending'
);`;

/* ──────────────────────────────────────────────
   Components
   ────────────────────────────────────────────── */

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
      className="h-9 w-9 rounded-lg"
    >
      <Sun className="h-4 w-4 hidden dark:block" />
      <Moon className="h-4 w-4 block dark:hidden" />
    </Button>
  );
};

/* ── Nav links shared between desktop & mobile ── */
const NAV_ITEMS = [
  { label: "Features", target: "features" },
  { label: "About", target: "about" },
  { label: "FAQ", target: "faq" },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

/* ──────────────────────────────────────────────
   Page
   ────────────────────────────────────────────── */

const Index = () => {
  const [sqlText, setSqlText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  /* Drag & drop */
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

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setSqlText(ev.target?.result as string);
          toast.success("File loaded successfully");
        };
        reader.readAsText(file);
      }
    },
    []
  );

  /* Parse */
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

  /* Sample loader */
  const loadSample = (sql: string, name: string) => {
    setSqlText(sql);
    toast.success(`Loaded "${name}" sample`);
  };

  /* ────────────────────── Render ────────────────────── */

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* ═══════════════════ NAVBAR ═══════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Database className="h-5 w-5 text-primary" />
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Schema Weaver
            </span>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Button
                key={item.target}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground text-[13px] font-medium"
                onClick={() => scrollTo(item.target)}
              >
                {item.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-[13px] font-medium"
              onClick={() => navigate("/my-diagrams")}
            >
              My Diagrams
            </Button>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <ThemeToggle />
          </div>

          {/* Mobile menu */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 pt-10">
                <div className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) => (
                    <Button
                      key={item.target}
                      variant="ghost"
                      className="justify-start text-[14px]"
                      onClick={() => {
                        scrollTo(item.target);
                        setMobileOpen(false);
                      }}
                    >
                      {item.label}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="justify-start text-[14px]"
                    onClick={() => {
                      navigate("/my-diagrams");
                      setMobileOpen(false);
                    }}
                  >
                    My Diagrams
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border)/0.3)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.3)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 pt-20 pb-24">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <Terminal className="h-3 w-3" />
              Client-side SQL parsing — no server, no signup
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-center text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] leading-[1.15]">
            Transform SQL into
            <br className="hidden sm:block" />{" "}
            <span className="text-primary">Interactive Database Diagrams</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-center text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Paste or upload your SQL to instantly generate interactive ER
            diagrams, TypeScript interfaces, and Markdown documentation — all in
            your browser.
          </p>

          {/* ── Console Panel ── */}
          <Card className="mt-10 glow-border border border-border bg-card/60 backdrop-blur-sm shadow-lg">
            <CardContent className="p-5 sm:p-6">
              {/* Drop zone */}
              <div
                className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
                  }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() =>
                  document.getElementById("file-input")?.click()
                }
              >
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  Drop a <code className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">.sql</code> file here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Supports PostgreSQL and MySQL syntax
                </p>
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
                placeholder="-- Or paste your CREATE TABLE statements here..."
                className="mt-4 min-h-[160px] font-mono text-[13px] leading-relaxed bg-background/50 border-border placeholder:text-muted-foreground/50"
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
              />

              {/* Samples */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground mr-1">
                  Try a sample:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loadSample(SAMPLE_SIMPLE, "Simple Blog")}
                >
                  <FileText className="mr-1 h-3 w-3" /> Simple Blog
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => loadSample(SAMPLE_INLINE_FK, "Inline FKs")}
                >
                  <FileText className="mr-1 h-3 w-3" /> Inline FKs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    loadSample(SAMPLE_WORDPRESS, "WordPress-like")
                  }
                >
                  <FileText className="mr-1 h-3 w-3" /> WordPress-like
                </Button>
              </div>

              {/* CTA */}
              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={handleParse}
              >
                <Zap className="mr-2 h-4 w-4" />
                Visualize Schema
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section id="features" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Built for developers who need to understand schemas instantly
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
              From visualization and interactive exploration to type generation
              and documentation — everything in one tool.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card
                key={f.title}
                className="group border-border/60 bg-card/50 hover:bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.icon className="h-[18px] w-[18px]" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════════════ DEMO TEASER ═══════════════════ */}
      <section className="border-t border-border/60 py-20 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              See it in action
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Paste SQL, get a diagram — it's that simple.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-lg">
            {/* Terminal bar */}
            <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-400/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-400/80" />
                <span className="h-3 w-3 rounded-full bg-green-400/80" />
              </div>
              <span className="ml-2 text-xs font-mono text-muted-foreground">
                schema-weaver — SQL Preview
              </span>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* SQL input side */}
              <div className="p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Input SQL
                </p>
                <pre className="font-mono text-[12px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
                  {DEMO_SQL}
                </pre>
              </div>

              {/* Diagram canvas preview */}
              <div className="relative p-5 overflow-hidden">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-4">
                  Diagram Canvas
                </p>

                {/* Dotted grid canvas background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--border)/0.4)_1px,transparent_1px)] bg-[size:16px_16px]" />

                {/* Diagram nodes container */}
                <div className="relative space-y-3">
                  {/* users table — mirrors real TableNode */}
                  <div className="group rounded-lg border border-border bg-card shadow-sm min-w-[200px] overflow-hidden transition-all duration-200 hover:border-primary hover:ring-2 hover:ring-primary/30 hover:shadow-md cursor-default">
                    <div className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold">
                      users
                    </div>
                    <div className="px-1 py-1">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">id</span>
                        <span className="text-muted-foreground text-[11px]">SERIAL</span>
                        <span className="text-[10px] px-1 py-0 h-4 inline-flex items-center rounded bg-chart-5 text-primary-foreground font-medium">PK</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">name</span>
                        <span className="text-muted-foreground text-[11px]">VARCHAR(100)</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">email</span>
                        <span className="text-muted-foreground text-[11px]">VARCHAR(255)</span>
                      </div>
                    </div>
                  </div>

                  {/* Relation connector */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="flex-1 border-t border-dashed border-primary/40" />
                    <span className="mx-3 text-[10px] font-mono font-medium text-primary bg-card px-2 py-0.5 rounded-full border border-primary/30">
                      1 : N
                    </span>
                    <div className="flex-1 border-t border-dashed border-primary/40" />
                  </div>

                  {/* orders table — mirrors real TableNode */}
                  <div className="group rounded-lg border border-border bg-card shadow-sm min-w-[200px] overflow-hidden transition-all duration-200 hover:border-primary hover:ring-2 hover:ring-primary/30 hover:shadow-md cursor-default">
                    <div className="bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold">
                      orders
                    </div>
                    <div className="px-1 py-1">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">id</span>
                        <span className="text-muted-foreground text-[11px]">SERIAL</span>
                        <span className="text-[10px] px-1 py-0 h-4 inline-flex items-center rounded bg-chart-5 text-primary-foreground font-medium">PK</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors group/fk">
                        <span className="text-foreground font-medium flex-1">user_id</span>
                        <span className="text-muted-foreground text-[11px] group-hover/fk:text-primary transition-colors">→ users.id</span>
                        <span className="text-[10px] px-1 py-0 h-4 inline-flex items-center rounded bg-secondary text-secondary-foreground font-medium">FK</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">total</span>
                        <span className="text-muted-foreground text-[11px]">DECIMAL(10,2)</span>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors">
                        <span className="text-foreground font-medium flex-1">status</span>
                        <span className="text-muted-foreground text-[11px]">VARCHAR(20)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex flex-col items-center gap-2">
            <Button
              onClick={() => {
                sessionStorage.setItem("schemamap-sql", DEMO_SQL);
                navigate("/visualize");
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Explore Full Diagram
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground">
              Loads this example into the interactive schema canvas.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ ABOUT ═══════════════════ */}
      <section id="about" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Why Schema Weaver?
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            Understanding database schemas from raw SQL is tedious and
            error-prone — especially on legacy codebases with dozens of tables.
            Schema Weaver instantly converts{" "}
            <code className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">
              CREATE TABLE
            </code>{" "}
            statements into clear, interactive structural diagrams, type-safe
            TypeScript interfaces, and portable documentation.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Built for developer productivity — whether you're onboarding onto a
            new project, reviewing a migration, or documenting your schema for
            your team. Everything runs entirely client-side with zero setup.
          </p>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section id="faq" className="border-t border-border/60 py-20">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-foreground sm:text-3xl mb-10">
            Frequently asked questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[13px] leading-relaxed text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Left */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Schema Weaver
              </span>
              <span className="text-xs text-muted-foreground">
                — SQL to ER diagrams, instantly.
              </span>
            </div>

            {/* Center links */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <button
                onClick={() => scrollTo("features")}
                className="hover:text-foreground transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollTo("about")}
                className="hover:text-foreground transition-colors"
              >
                About
              </button>
              <button
                onClick={() => scrollTo("faq")}
                className="hover:text-foreground transition-colors"
              >
                FAQ
              </button>
              <button
                onClick={() => navigate("/my-diagrams")}
                className="hover:text-foreground transition-colors"
              >
                My Diagrams
              </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="#" aria-label="Documentation">
                  <BookOpen className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Schema Weaver. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

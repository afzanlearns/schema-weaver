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
  LayoutGrid,
  Eye,
  Sun,
  Moon,
  Menu,
  Github,
  BookOpen,
  ArrowRight,
  Terminal,
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
    title: "SQL → ER Diagram",
    desc: "Instantly visualize CREATE TABLE statements as interactive, draggable entity-relationship diagrams.",
  },
  {
    icon: Eye,
    title: "Full Schema Diagram Mode",
    desc: "Switch to Chen notation with entities, attribute ovals, and relationship diamonds with cardinality labels.",
  },
  {
    icon: Code,
    title: "TypeScript Interfaces",
    desc: "Auto-generate clean TypeScript interfaces with proper type mapping and nullable fields from your schema.",
  },
  {
    icon: FileDown,
    title: "Markdown Documentation",
    desc: "Export complete schema documentation as Markdown — ready for your repo wiki or README.",
  },
  {
    icon: GitBranch,
    title: "Interactive Relationships",
    desc: "Hover over foreign keys to highlight relationship paths across your entire schema graph.",
  },
  {
    icon: LayoutGrid,
    title: "Layout Modes",
    desc: "Choose between cluster, compact, and spacious layout modes to best fit your schema complexity.",
  },
];

const FAQS = [
  {
    q: "Does the app execute SQL queries?",
    a: "No. Schema Weaver only parses your SQL text client-side to extract structure. It never connects to a database or executes any statements.",
  },
  {
    q: "What SQL dialects are supported?",
    a: "PostgreSQL and MySQL CREATE TABLE syntax, including inline and out-of-line foreign keys, composite primary keys, and common column constraints.",
  },
  {
    q: "Is my schema stored or processed client-side?",
    a: "All data stays in your browser. Schema Weaver uses localStorage for saved diagrams and sessionStorage for the active session. Nothing is sent to any server.",
  },
  {
    q: "Can diagrams be edited after generation?",
    a: "Yes. You can drag and reposition nodes, toggle auto-layout algorithms, and save your custom arrangement to your browser for later.",
  },
  {
    q: "How are TypeScript types derived?",
    a: "SQL types are mapped to TypeScript equivalents: INT → number, VARCHAR → string, BOOLEAN → boolean, JSON → Record<string, unknown>, TIMESTAMP → string. Nullable columns become optional fields.",
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
              Built for developers
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Everything you need to understand, communicate, and document
              database schemas — fast.
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

      {/* ═══════════════════ DEMO TEASER ═══════════════════ */}
      <section className="border-t border-border/60 py-20 bg-card/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center mb-8">
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

              {/* Output side */}
              <div className="p-5">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
                  Generated Output
                </p>
                <div className="space-y-3">
                  {/* users table */}
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-xs font-semibold text-foreground">
                        users
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                      <div className="flex gap-2">
                        <span className="text-primary">PK</span>
                        <span>id</span>
                        <span className="ml-auto text-foreground/40">SERIAL</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-transparent">PK</span>
                        <span>name</span>
                        <span className="ml-auto text-foreground/40">VARCHAR(100)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-transparent">PK</span>
                        <span>email</span>
                        <span className="ml-auto text-foreground/40">VARCHAR(255)</span>
                      </div>
                    </div>
                  </div>

                  {/* orders table */}
                  <div className="rounded-lg border border-border bg-background/50 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-3.5 w-3.5 text-primary" />
                      <span className="font-mono text-xs font-semibold text-foreground">
                        orders
                      </span>
                    </div>
                    <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
                      <div className="flex gap-2">
                        <span className="text-primary">PK</span>
                        <span>id</span>
                        <span className="ml-auto text-foreground/40">SERIAL</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-yellow-500">FK</span>
                        <span>user_id</span>
                        <span className="ml-auto text-foreground/40">→ users.id</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-transparent">PK</span>
                        <span>total</span>
                        <span className="ml-auto text-foreground/40">DECIMAL(10,2)</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-transparent">PK</span>
                        <span>status</span>
                        <span className="ml-auto text-foreground/40">VARCHAR(20)</span>
                      </div>
                    </div>
                  </div>

                  {/* Relationship */}
                  <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                    <GitBranch className="h-3 w-3 text-primary" />
                    <span>orders.user_id → users.id</span>
                    <span className="ml-auto text-foreground/40">1:N</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => {
                setSqlText(DEMO_SQL);
                window.scrollTo({ top: 0, behavior: "smooth" });
                toast.success("Sample SQL loaded — scroll up to visualize");
              }}
            >
              <Zap className="mr-2 h-4 w-4" />
              Try this example
            </Button>
          </div>
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


# SchemaMap: SQL Parser → ER Diagram Generator

## Overview
A client-side web app that parses SQL dump files/text, visualizes schemas as interactive ER diagrams, generates TypeScript interfaces, and exports documentation. No backend required — everything runs in the browser.

## Pages & Routes

### 1. **Home / Upload Page** (`/`)
- Drag-and-drop zone for `.sql` files
- Textarea for pasting SQL text directly
- 3 sample SQL buttons (simple schema, inline FKs, WordPress-like) for quick demos
- "Parse & Visualize" button that navigates to the diagram view

### 2. **Diagram Visualizer** (`/visualize`)
- **Interactive ER Diagram** (React Flow) with:
  - Each table as a node showing table name, columns, types, PK/FK badges
  - Edges connecting foreign key relationships (with cardinality labels)
  - Pan, zoom, drag-and-drop repositioning
- **Side Panel** (collapsible):
  - Click a table node → shows full column details (type, nullable, default, constraints)
  - TypeScript interface preview for the selected table
  - "Copy TypeScript" button
- **Toolbar**:
  - Auto-layout button (arrange nodes neatly)
  - Export Markdown docs button
  - Export JSON layout button
  - "Generate All TypeScript" button (all tables at once)
  - Save to browser / Load from browser buttons

### 3. **My Diagrams** (`/my-diagrams`)
- List of previously saved diagrams (from localStorage)
- Each entry shows: name, table count, date saved
- Load or delete saved diagrams

## Core Engine (Client-Side)

### SQL Parser
- Parse `CREATE TABLE` statements extracting table names, columns, types, constraints
- Detect primary keys (`PRIMARY KEY`), foreign keys (`FOREIGN KEY ... REFERENCES`)
- Handle common PostgreSQL/MySQL syntax variations
- Graceful error handling with partial results + error messages
- Output structured JSON: `{tables, relationships, errors}`

### TypeScript Generator
- Map SQL types → TypeScript: `int→number`, `varchar→string`, `timestamp→string`, `boolean→boolean`, `json→any`, etc.
- Generate clean interfaces with optional fields for nullable columns
- Support copying individual or all interfaces

### Markdown Exporter
- Generate documentation with table descriptions, column tables, and relationship summaries
- Downloadable as `.md` file

### JSON Layout Exporter
- Export diagram node positions + schema data as JSON for re-importing

## Design & UX
- Clean, minimal UI with a dark/light mode toggle
- Color-coded column types (PKs in gold, FKs in blue, nullable in gray)
- Responsive layout but optimized for desktop (diagram interaction needs space)
- Toast notifications for actions (copied, saved, exported)

## Sample Data
- 3 built-in SQL examples users can load instantly to try the tool

## Testing
- Unit tests for the SQL parser covering the 3 sample schemas
- Edge cases: missing semicolons, inline constraints, multi-line definitions

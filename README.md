
# Schema Weaver

Schema Weaver is a developer tool that converts raw SQL schema definitions into interactive visual diagrams and usable TypeScript interfaces. It helps engineers quickly understand unfamiliar databases by providing both structural and conceptual views of the schema without executing any SQL or requiring a database connection.

The application runs entirely in the browser and focuses on clarity, exploration, and developer productivity.

---

## What This Project Does

Schema Weaver takes SQL schema input and generates:

- A Schema Diagram for structural analysis of tables, columns, and constraints
- An ER Diagram for conceptual understanding of entities and relationships
- TypeScript interfaces derived directly from table definitions
- Markdown documentation summarizing schema structure and relationships

This enables faster onboarding into existing databases, clearer reasoning about relationships, and immediate integration with modern TypeScript-based applications.

---

## Why This Project Matters

Understanding large SQL schemas manually is time-consuming and error-prone. Schema Weaver solves this by transforming static SQL into interactive, navigable visual models that allow developers to inspect tables, trace relationships, and reason about database design quickly.

The project demonstrates:
- Strong frontend engineering using React and Next.js
- Deep understanding of database structures and relationships
- Thoughtful UX design for complex technical visualization
- Real-world developer tooling concepts such as type generation and documentation export

---

## Key Features

### SQL to Visual Diagrams
Paste or upload SQL schema definitions to instantly generate:
- Interactive schema diagrams (tables, columns, constraints)
- Conceptual ER diagrams using standard entity-relationship notation

### Dual View Modes
- Schema Mode: Structural view of database tables and foreign keys
- ER Mode: Conceptual view of entities, attributes, and relationships

### Interactive Exploration
- Inspect tables and view detailed column metadata
- Highlight relationships between entities
- Hover-based visual emphasis for better comprehension

### ER Diagram Legend
A built-in legend explains entities, relationships, attributes, and cardinalities. Hovering over legend items highlights corresponding elements across the diagram.

### TypeScript Interface Generation
Automatically converts SQL table definitions into ready-to-use TypeScript interfaces for type-safe application development.

### Markdown Documentation Export
Generates clean Markdown documentation summarizing tables, columns, constraints, and relationships.

### Layout Controls
Adjust orientation, spacing, and clustering to improve readability for large schemas.

### Dark Mode Support
A carefully tuned dark theme with improved contrast for better diagram visibility.

### Local Storage Persistence
All diagrams and parsed schema data are stored locally in the browser. No database or backend is required.

---

## Tech Stack

- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Flow (diagram rendering)
- Client-side SQL parsing logic

---

## How to Run Locally

Follow these steps to run the project on your machine:

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/schema-weaver.git
cd schema-weaver
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Development Server
```bash
npm run dev
```

### 4. Open in Browser
Visit:
```
http://localhost:3000
```

You can now paste SQL schema definitions and start generating diagrams immediately.

---

## Example Workflow

1. Paste a SQL schema or upload a `.sql` file  
2. View the Schema Diagram to understand table structure  
3. Switch to ER Diagram mode to analyze relationships  
4. Inspect nodes to view column-level details  
5. Copy generated TypeScript interfaces for application use  
6. Export Markdown documentation for reference  

All processing is done client-side, ensuring privacy and fast performance.

---

## Design Philosophy

Schema Weaver is intentionally focused and minimal. The goal is not to become a full database management tool, but a fast, reliable schema understanding utility.

Key principles:
- Clarity over visual clutter
- Interactive exploration over static diagrams
- Developer-centric workflows
- Privacy-first, no SQL execution
- Lightweight and fast client-side architecture

---

## Limitations

- Parses SQL schema definitions only; does not execute queries
- Very large schemas may require careful layout adjustment for readability
- Relationship detection depends on defined foreign key constraints

---

## Potential Extensions

The architecture allows future enhancements such as:
- Focus mode for isolating entity relationships
- Command palette search for navigating large schemas
- Shareable diagram links for collaboration

These can be added without changing the core client-side design.

---

## Summary

Schema Weaver is a practical developer utility that transforms raw SQL schemas into interactive visual models and type-safe interfaces. It demonstrates strong frontend engineering, thoughtful UX design for complex data visualization, and a clear understanding of real-world developer workflows involving database exploration and integration.

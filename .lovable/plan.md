

# SchemaMap Enhancement Plan

## Summary

Two major changes: (1) a new "Full ER Diagram" visualization mode inspired by Chen notation (entities as rectangles, relationships as diamonds, attributes as ovals), and (2) a complete landing page redesign with navigation, hero, features, about, FAQ, and footer sections. The product name will be changed to **Schema Weaver**.

---

## Part 1: Full ER Diagram View

### What it does
Adds an alternative visualization mode on the `/visualize` page. Users can toggle between:
- **Schema View** (current table-node view)
- **ER Diagram View** (Chen-style: entities as rectangles, attributes as ovals, relationships as diamonds with cardinality labels like 1, N, M)

### Implementation

**New components:**
- `src/components/EREntityNode.tsx` -- Rectangle node for table entities (styled like the reference image)
- `src/components/ERAttributeNode.tsx` -- Oval node for each column/attribute, with underline for PKs
- `src/components/ERRelationshipNode.tsx` -- Diamond node for each FK relationship (labeled with the relationship name, e.g., "WORKS_FOR")

**Changes to `src/pages/Visualize.tsx`:**
- Add a state toggle: `viewMode: "schema" | "er"`
- Add a toggle button in the toolbar (e.g., "Schema View" / "ER Diagram" toggle)
- When `viewMode === "er"`, generate a different set of React Flow nodes and edges:
  - Each table becomes an entity rectangle node
  - Each column becomes an oval attribute node positioned around the entity
  - Each FK relationship becomes a diamond node connecting two entities
  - Edges connect entities to their attributes, and entities to relationship diamonds with cardinality labels (1, N)
- The layout algorithm will arrange entities in a grid, fan out attributes radially around each entity, and position relationship diamonds between connected entities

**ER layout function:**
- `erAutoLayout(tables, relationships)` -- positions entity nodes in a grid, attribute nodes in a fan/arc around each entity, and relationship diamonds midway between connected entities

### Cardinality logic
- FK column that is also a PK or UNIQUE = "1" side
- FK column that is neither = "N" side
- Default: the referencing side is "N", the referenced side is "1"

---

## Part 2: Landing Page Redesign

### Branding
- Rename from "SchemaMap" to **Schema Weaver** across all pages (header, title, etc.)

### New page structure for `src/pages/Index.tsx`

The page will be restructured into these sections, all within a single scrollable page:

**2.1 Navigation Bar (sticky)**
- Logo: Schema Weaver with a Database icon
- Links: Features, About, FAQ, My Diagrams
- Links scroll to in-page sections (Features, About, FAQ) except "My Diagrams" which navigates to `/my-diagrams`
- Clean, minimal styling with backdrop blur

**2.2 Hero Section**
- Large headline: "Transform SQL into Visual Schema Diagrams"
- Subheading: explains paste/upload SQL to generate ER diagrams and TypeScript interfaces
- Embedded drag-and-drop zone + SQL textarea (the current upload functionality, refined visually)
- Sample SQL buttons below the textarea
- Primary CTA: "Visualize Schema" button
- Premium feel with subtle background gradient or pattern

**2.3 Features Section**
- 6 feature cards in a grid:
  1. SQL to ER Diagram visualization
  2. Full Database ER Diagram mode (Chen notation)
  3. TypeScript interface generation
  4. Markdown documentation export
  5. JSON layout export
  6. Save and reload diagrams
- Each card with an icon, heading, and short description

**2.4 About Section**
- Brief explanation of Schema Weaver's purpose
- Focus on developer productivity, simplifying database understanding
- Professional, confident tone

**2.5 FAQ Section**
- Accordion-style FAQ with these questions:
  - What SQL dialects are supported?
  - Does the app execute SQL queries?
  - Can I edit diagrams after generation?
  - How are TypeScript types derived?
  - Is my schema stored securely?

**2.6 Footer**
- Product name and tagline
- Navigation links
- Copyright notice

### Files changed
- `src/pages/Index.tsx` -- full rewrite with new sections
- `src/pages/MyDiagrams.tsx` -- update branding to "Schema Weaver"
- `src/pages/Visualize.tsx` -- update branding, add ER view toggle
- `index.html` -- update page title

### New files
- `src/components/EREntityNode.tsx`
- `src/components/ERAttributeNode.tsx`
- `src/components/ERRelationshipNode.tsx`

---

## Technical Details

### ER Diagram Node Types (React Flow custom nodes)

**EREntityNode**: Renders as a rectangle with the table name centered, bold text, border styling consistent with the reference image.

**ERAttributeNode**: Renders as an oval (using CSS border-radius: 50% on a wider element). Text is the column name. PK attributes get underlined text. FK attributes get a dashed border.

**ERRelationshipNode**: Renders as a rotated square (diamond shape via CSS transform: rotate(45deg)). Contains the relationship label.

### Edge styling for ER mode
- Entity-to-attribute edges: thin, straight lines
- Entity-to-relationship edges: labeled with cardinality (1 or N) at each end using `edgeLabel`

### Layout algorithm for ER mode
- Place entity nodes in a grid with generous spacing (~600px horizontal, ~500px vertical)
- For each entity, arrange its attribute ovals in an arc/fan above and around the entity
- Place relationship diamonds at the midpoint between two connected entities
- This is a static layout; users can still drag nodes after rendering

### Scroll-based navigation
- Use `id` attributes on sections (e.g., `id="features"`, `id="about"`, `id="faq"`)
- Nav links use `href="#features"` style smooth scrolling via `scroll-behavior: smooth` on the html element


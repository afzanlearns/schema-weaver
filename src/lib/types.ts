export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
  constraints: string[];
}

export interface Table {
  name: string;
  columns: Column[];
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export interface ParseResult {
  tables: Table[];
  relationships: Relationship[];
  errors: string[];
}

export interface SavedDiagram {
  id: string;
  name: string;
  sql: string;
  tableCount: number;
  dateSaved: string;
  nodePositions?: Record<string, { x: number; y: number }>;
}

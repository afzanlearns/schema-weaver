import type { SavedDiagram } from "./types";

const STORAGE_KEY = "schemamap-diagrams";

export function getSavedDiagrams(): SavedDiagram[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveDiagram(diagram: SavedDiagram): void {
  const diagrams = getSavedDiagrams();
  const idx = diagrams.findIndex((d) => d.id === diagram.id);
  if (idx >= 0) {
    diagrams[idx] = diagram;
  } else {
    diagrams.push(diagram);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
}

export function deleteDiagram(id: string): void {
  const diagrams = getSavedDiagrams().filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagrams));
}

export function getDiagram(id: string): SavedDiagram | undefined {
  return getSavedDiagrams().find((d) => d.id === id);
}

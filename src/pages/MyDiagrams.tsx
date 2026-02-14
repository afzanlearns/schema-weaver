import React from "react";
import { useNavigate } from "react-router-dom";
import { getSavedDiagrams, deleteDiagram } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const MyDiagrams = () => {
  const navigate = useNavigate();
  const [diagrams, setDiagrams] = React.useState(getSavedDiagrams());

  const handleLoad = (id: string, sql: string) => {
    sessionStorage.setItem("schemamap-sql", sql);
    navigate("/visualize");
  };

  const handleDelete = (id: string) => {
    deleteDiagram(id);
    setDiagrams(getSavedDiagrams());
    toast.success("Diagram deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Schema Weaver</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h2 className="text-2xl font-bold text-foreground mb-6">My Diagrams</h2>

        {diagrams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved diagrams yet.</p>
            <p className="text-sm mt-1">Parse some SQL and save your first diagram!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {diagrams.map((d) => (
              <Card key={d.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{d.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleLoad(d.id, d.sql)}>
                        <ExternalLink className="h-4 w-4 mr-1" /> Open
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {d.tableCount} tables · Saved {new Date(d.dateSaved).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyDiagrams;

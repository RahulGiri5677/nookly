import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, ChevronRight, ArrowLeft, Trash2, RefreshCw, Archive } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableInfo {
  table_name: string;
  row_count: number;
  columns: { name: string; type: string; nullable: boolean }[];
}

export function DbExplorer() {
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const callApi = useCallback(async (body: Record<string, unknown>) => {
    const res = await supabase.functions.invoke("admin-discovery", { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, []);

  const loadSchema = useCallback(async () => {
    setLoading(true);
    try {
      const data = await callApi({ action: "discover_schema" });
      setSchema(data.schema || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callApi, toast]);

  const loadTable = useCallback(async (tableName: string) => {
    setLoading(true);
    setSelectedTable(tableName);
    try {
      const data = await callApi({ action: "read_table", table_name: tableName });
      setRows(data.rows || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [callApi, toast]);

  const deleteRow = useCallback(async (rowId: string) => {
    try {
      await callApi({ action: "delete_row", table_name: selectedTable, row_id: rowId });
      toast({ title: "Deleted ✅" });
      if (selectedTable) loadTable(selectedTable);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [callApi, selectedTable, loadTable, toast]);

  const archiveNook = useCallback(async (nookId: string) => {
    try {
      await callApi({ action: "archive_nook", nook_id: nookId });
      toast({ title: "Archived ✅", description: "Nook has been cancelled/archived." });
      if (selectedTable) loadTable(selectedTable);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [callApi, selectedTable, loadTable, toast]);

  const hardDeleteNook = useCallback(async (nookId: string) => {
    if (!confirm("Permanently delete this nook and all related data?")) return;
    try {
      await callApi({ action: "delete_nook", nook_id: nookId });
      toast({ title: "Permanently Deleted 🗑️" });
      if (selectedTable) loadTable(selectedTable);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [callApi, selectedTable, loadTable, toast]);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  if (selectedTable) {
    const tableInfo = schema.find(t => t.table_name === selectedTable);
    const columns = tableInfo?.columns || [];
    const visibleCols = columns.slice(0, 4).map(c => c.name);

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setSelectedTable(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-sm flex-1">{selectedTable}</h3>
          <Badge variant="outline" className="text-[10px]">{total} rows</Badge>
          <Button size="sm" variant="ghost" onClick={() => loadTable(selectedTable)}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>

        {/* Column info */}
        <div className="flex flex-wrap gap-1">
          {columns.map(c => (
            <Badge key={c.name} variant="secondary" className="text-[9px]">
              {c.name} <span className="text-muted-foreground ml-0.5">({c.type})</span>
            </Badge>
          ))}
        </div>

        {/* Rows */}
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-2">
            {rows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No rows found</p>
            )}
            {rows.map((row, i) => (
              <Card key={row.id || i} className="overflow-hidden">
                <CardContent className="p-3 space-y-1.5">
                  {visibleCols.map(col => (
                    <div key={col} className="flex justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium shrink-0">{col}</span>
                      <span className="text-[10px] text-foreground text-right truncate max-w-[60%]">
                        {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "—")}
                      </span>
                    </div>
                  ))}
                  {columns.length > 4 && (
                    <details className="mt-1">
                      <summary className="text-[9px] text-primary cursor-pointer">
                        + {columns.length - 4} more fields
                      </summary>
                      <div className="mt-1 space-y-1">
                        {columns.slice(4).map(c => (
                          <div key={c.name} className="flex justify-between gap-2">
                            <span className="text-[10px] text-muted-foreground font-medium shrink-0">{c.name}</span>
                            <span className="text-[10px] text-foreground text-right truncate max-w-[60%]">
                              {typeof row[c.name] === "object" ? JSON.stringify(row[c.name]) : String(row[c.name] ?? "—")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {row.id && (
                    <div className="flex justify-end gap-1 pt-1 border-t border-border">
                      {selectedTable === "nooks" && row.status !== "cancelled" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-warning-foreground"
                          onClick={() => archiveNook(row.id)}>
                          <Archive className="w-3 h-3 mr-1" /> Archive
                        </Button>
                      )}
                      {selectedTable === "nooks" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive"
                          onClick={() => hardDeleteNook(row.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      )}
                      {selectedTable !== "nooks" && (
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive"
                          onClick={() => deleteRow(row.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Database className="w-4 h-4" /> All Tables
        </h3>
        <Button size="sm" variant="ghost" onClick={loadSchema} disabled={loading}>
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Auto-discovered from your database. New tables appear automatically.
      </p>

      <div className="space-y-2">
        {schema.map(table => (
          <button
            key={table.table_name}
            onClick={() => loadTable(table.table_name)}
            className="w-full p-3 bg-card rounded-xl border border-border text-left transition-all hover:border-primary/30 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{table.table_name}</p>
                <p className="text-[10px] text-muted-foreground">{table.columns?.length || 0} columns</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{table.row_count} rows</Badge>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
